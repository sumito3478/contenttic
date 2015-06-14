---
title: Scalateで独自のフィルタを定義する
author: sumito3478
createdAt: 2014-08-01
date: 2014-08-01
lang: ja
tags: [programming, scala, scalate]
---

# Scalateで独自のフィルタを定義する

## Scalateとは

[Scalate](http://scalate.fusesource.org/)というScala用のテンプレートエンジンがある。
Mustache（[mustache.js](http://github.com/janl/mustache.js)のフォーマットの方言）,
Scaml（[Haml](http://haml-lang.com/)の方言）,
Jade（[Jade](http://scalate.fusesource.org/documentation/jade.html)の方言）,
SSP(Velocity/JSP/Erbに似たフォーマット)に（一部方言はあるが）対応した
テンプレートエンジンだ。
もし読者が[http://sld.sumito3478.info/](http://sld.sumito3478.info)にあるHTMLでこの記事を見ているならば、
そのHTMLもScalateと[Pandoc](http://johnmacfarlane.net/pandoc/)を使ってJadeとMarkdownから生成されている。

## ScalateでJadeのフィルタ

Jadeではフィルタと呼ばれる仕組みを使って他のフォーマットの文字列をJadeの中に埋め込むことができる。
以下はJadeの中にMarkdownで書かれたテキストを埋め込む例だ[^1]。

```jade
!!! 5
html(lang="en")
  head
    title Markdown Filter Example
  body
    h1 Markdown Filter Example
    :markdown
      - this is a
      - list

      And this is a paragraph!
```


## Scalateで独自のフィルタを定義する

ScalateのmarkdownフィルタはscalamdかMarkdownJのうち、クラスパスに存在するものが使われる
（なければエラーになるはず）。
しかしPandocの方が明らかに高機能、かつScalate以外から使うときには間違いなくPandocを使うだろう、
というわけでPandocでMarkdownからHTMLへ変換するフィルタを独自に定義することにした。

Scalateのドキュメントには独自のフィルタを定義する方法は書かれていないようだが
（ちゃんと読んだわけではないので見逃しているかもしれない）、
scalate-markdownjというモジュールに定義されたMarkdownJ用のフィルタなどは、
モジュールをクラスパスに入れただけで読み込まれるので、動的にフィルタを探して読み込んでいるはずだ
（決め打ちして探していなければ）。そして実際、そうしていた。

Scalateは'META-INF/services/org.fusesource.scalate/addon.index'というパスのリソース
を読み込んで、そこに書かれている名前のScalaのobjectを読み込む。
JDKにおけるリソースについて詳しくない読者のために言っておくと、クラスパスの下にMETA-INF/services/org.fusesource.scalate/addon.indexというパスのファイルをおいておけば良い。
objectはTemplateEngineAddOnの部分型である必要がある。Scalateはそのobjectの
apply(TemplateEngine)メソッドを呼ぶので、そこでTemplateEngine.filtersにフィルタを追加すれば
いいというわけだ。フィルタはFilterの部分型で、filter(RenderContext, String): Stringを実装すれば良い。

### META-INF/services/org.fusesource.scalate/addon.index

```prop
sine.lite.dies.PandocFilter
```

### PandocFilter.scala

```scala
package sine.lite.dies

import java.io._
import scala.sys.process._
import org.fusesource.scalate._
import org.fusesource.scalate.filter._

object PandocFilter extends Filter with TemplateEngineAddOn {
  def filter(context: RenderContext, content: String) =
    (Seq("pandoc", "-f", "markdown", "-t", "html5") #< new ByteArrayInputStream(content.getBytes("UTF-8"))).!!

  def apply(te: TemplateEngine) =
    if (!te.filter.contains("pandoc-markdown"))
      te.filter += "pandoc-markdown" -> this
}
```

これでpandoc-markdownフィルタを使えるようになった。

### test.jade

```jade
!!! 5
html(lang="en")
  head
    title Markdown Filter Example
  body
    h1 Markdown Filter Example
    :pandoc-markdown
      # Pandoc Markdown
      this markdown code is converted by pandoc!
```

# Test.scala

```scala
import org.fusesource.scalate._

object Test extends App {
  val engine = new TemplateEngine
  println(engine.layout("test.jade"))
}
```

実際のコードでは、pandocを呼び出すところでなぜかハングが頻発してしまったので、
一定時間内に返ってこなければスレッドをinterruptして強制的に抜け、リトライするようにしている
（scala.sys.processでタイムアウトを設定する方法を知らない…）。
何かおろかな間違いをしていそうなのだが調査は後日。

[^1]:
  !!!5というのはHaml由来の構文で、オリジナルのJadeのdoctype htmlと同じだ。
  オリジナルのJadeで!!!5を書いたら以下のようなエラーになった。昔はサポートしていたらしい。
```
Error: `!!!` is deprecated, you must now use `doctype`
```
  ScalateのJadeではdoctype htmlとは書けないようなので、Hamlの記法を使う。

