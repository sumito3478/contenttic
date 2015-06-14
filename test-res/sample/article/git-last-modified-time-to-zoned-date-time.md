---
title: Gitでの最終更新コミットの日時をjava.time.ZonedDateTimeに変換する
author: sumito3478
createdAt: 2014-08-02
date: 2014-08-02
lang: ja
tags: [programming, scala, git]
---

# Gitでの最終更新コミットの日時をjava.time.ZonedDateTimeに変換する

もし読者が[http://sld.sumito3478.info/](http://sld.sumito3478.info)にあるHTMLでこの記事を見ているならば、
そのHTMLは自作の静的サイトジェネレータを用いて生成されている。
静的サイトジェネレータの機能として、元になるMarkdownファイルのGitでの最終更新コミットの日時を取得して、HTMLに最終更新日を載せている。

## git log --date=iso --pretty=format:%ad

`git log --date=iso --pretty=format:%ad`を実行すると、以下のようにAuthorの日付だけ、新しいものから順に出力される。
最初の行を取れば最終更新日時、最後の行を取れば作成日時が得られるというわけだ。
```
2014-08-02 20:41:06 +0900
2014-08-02 20:30:40 +0900
2014-08-02 19:54:43 +0900
2014-08-02 19:51:10 +0900
2014-08-02 11:57:10 +0900
2014-08-02 09:41:46 +0900
2014-08-02 09:32:13 +0900
2014-08-02 07:19:18 +0900
2014-08-01 21:51:12 +0900
2014-08-01 21:39:14 +0900
2014-07-31 07:41:20 +0900
2014-07-30 04:18:21 +0900
```

特定のファイルの更新時刻を得るにはファイルのパスを指定する。
また、今回は最終更新日時、すなわち最初の行だけが必要なので、オプションに-1をつけて最初の行だけを取る（総コミット数が多い時にたぶん有効）。
さらに、--followをつけるとファイルの移動まで追ってくれる。

```bash
git log -1 --date=iso --pretty=format:%ad --follow path/to/file
```

## java.time.ZonedDateTime

ZonedDateTimeはJDK8に入ったDate and Time API（JSR310）の一部で、タイムゾーン情報込みの日時を保持する。
僕はJSR310が使えるようになってから、JDKの日時APIとしてはJSR310をずっと使っていて、今回もgitの出力をZonedDateTimeに変換して使っている。

## コード

pathにSome[Path]を渡した場合は特定のファイルの最終更新日時、渡さなかった場合はレポジトリ全体の最終更新日時を返すようにした。

```scala
package sine.lite.dies

import scala.sys.process._
import java.nio.file._
import java.time._
import java.time.format._

object Git {
  def lastModifiedTime(path: Option[Path] = None): Option[ZonedDateTime] =
    (Seq("git", "log", "-1", "--date=iso", "--pretty=format:%ad") ++ path.toSeq.flatMap(x => Seq("--follow", x.toString)))
      .lineStream.dropWhile(_.isEmpty).headOption.map(ZonedDateTime.parse(_, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss Z")))
}
```

## 未実装

ワークツリーでの変更は考慮していない。
後で修正を加えて、ワークツリー上で更新されている場合はコミットの最終更新日時とファイルシステム上の最終更新日時を比較して、新しい方を返そうと思う。
現状の実装では、ファイルがレポジトリにない（一度もコミットがない）場合はNoneを返しているが、`getOrElse(<ファイルシステム上の最終更新日時>)`とするわけだ。

ちなみに、そもそもレポジトリでない場所に対して呼ぶと例外を送出している。これを今後どうするかは未定。

## JGitは？

インプロセスなライブラリとして再利用できるGitの実装として、libgit(Cと多くのバインディング), JGit(JDK), Dulwich(Python)などがある。
しかし本家のコマンドで用が足りるならそれで良いと思う。

gitのコマンドは他のプログラムから呼び出されることが多い。実際、gitの少なくない数のコマンドが、他のコマンドを呼び出すことで実装されたシェルスクリプトなのだ。
同じことをScala等の言語からすることは、もっと積極的にしても良いと思う。将来JGitが必要になるなら、その時に考える。

ところで、昔DulwitchというGitのPure Pythonな実装のコードを読んだことがあったが、Pythonの実装で特に遅い部分については、もしgitのコマンドがあれば呼び出していた
（まだそのコードが残っているかは見ていない）。この割り切りは好きだ。

