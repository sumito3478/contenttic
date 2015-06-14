---
title: このサイトの静的サイトジェネレータとドメインを刷新した
author: sumito3478
createdAt: 2015-06-06
date: 2015-06-06
lang: ja
tags: [programming, nodejs]
---

# 静的サイトジェネレータを Node.js ベースに

ECMAScript 6 の練習を兼ねて Scala + JVM から Babel + Node.js に移行した。

- Jade の変換に [本家Jade](https://github.com/jadejs/jade)
- Markdown の変換に [remarkable](https://github.com/jonschlinkert/remarkable)

を使うようになった。明日 (2015/06/07) にも GitHub にジェネレータのレポジトリが作られているだろう。

以前のジェネレータは異常に遅かったのだが、書き直しにより（はからずも）高速化された。
遅かった理由はよく調べていないが、たぶん Scalate で Jade のソースをコンパイルするのが遅かったようだ。
さらに、Pandoc を外部プロセスとして呼び出すときにハングしたようになっていた気がする。
プロセス API の使い方がまずかったのかもしれない。でも Node.js に移行したからもういいや。

自分で静的サイトジェネレータをつくったものの、機能が貧弱な観は否めなかったし今も特に機能追加したわけではないので否めない。
しかし Node.js で動く Web サイト関連のライブラリは豊富なので、Node.js に移行した結果、
開発が速く進むことを（自分で自分に）期待している。

# ドメインを sineli.ttic.press に

最近 ttic.press というドメインをとった。
たとえば sta.ttic.press のように、
サブドメインを工夫すれば面白いドメインになるというもくろみだ。
このサイトも sineli.ttic.press に移行する。以前のドメインからはリダイレクトする。

TLD が .press なのは、最近出版（特に電子出版）に興味があり、出版会のようなものを始めたいという
意気込みからきたものだ。その意気込みが形になるかどうかは未定だが。

