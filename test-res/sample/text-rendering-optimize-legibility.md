---
title: text-rendering optimizeLegibility
author: sumito3478
createdAt: 2014-08-03
date: 2014-08-03
lang: ja
tags: [programming, web, css]
---

# text-rendering optimizeLegibility

CSSのtext-renderingプロパティを使うと、
カーニングと合字の調整をするかどうか指定できる。

_この記事を書いている時点でのFirefoxは、調整の有無が性能に影響しないため、常に調整を行う。
比較したい場合は、この記事を書いている時点でのChromeや他のWebKit系ブラウザで試すことができるはずだ。[^1]_

以下の文章は、前半は`text-rendering: optimizeLegibility`を指定して調整を有効にし、後半は`text-rendering: optimizeSpeed`を指定して無効にしものだ。

<div class=".text" lang="la">
<div style="text-rendering: optimizeLegibility">

- Cuius, uis <span style="text-decoration: underline">fi</span>eri, libelle munus?
- verum video med ad saxa ferri saevis <span style="text-decoration: underline">fl</span>uctibus.
- haec dabit a<span style="text-decoration: underline">ff</span>ectus: ille excludatur amicus  
  iam senior, cuius barbam tua ianua vidit.
- VALERIANUS

</div>
<div style="text-rendering: optimizeSpeed">

- Cuius, uis <span style="text-decoration: underline">fi</span>eri, libelle munus?
- verum video med ad saxa ferri saevis <span style="text-decoration: underline">fl</span>uctibus.
- haec dabit a<span style="text-decoration: underline">ff</span>ectus: ille excludatur amicus  
  iam senior, cuius barbam tua ianua vidit.
- VALERIANUS

</div>
</div>

読者がこの記事のHTMLを合字の自動調整をサポートしているWebブラウザで見ているならば、
前半では、fi, fl, ff（下線を付した）が合字になって表示され、後半ではばらばらに表示されるはずだ。

また、Webブラウザがカーニングの自動調整をサポートしているならば、一番目のVALERIANUSのVとAの間のスペースが小さくなるように調整されているのが
わかるだろう。二番目は調整されていないので、VとAの間のスペースが大きく、間延びしてしまっているはずだ。

ちなみに、直接Unicodeの合字を使えば、ブラウザに頼ることなく合字を使うことはできる
（フォントにそのグリフがあるかどうかは別）。
以下は`text-rendering: optimizeSpeed`で合字を無効にしているが、そもそものテキストデータで
合字を使っている例だ。

<div class=".text" lang="la" style="text-rendering: optimizeSpeed">

- Cuius, uis <span style="text-decoration: underline">ﬁ</span>eri, libelle munus?
- verum video med ad saxa ferri saevis <span style="text-decoration: underline">ﬂ</span>uctibus.
- haec dabit a<span style="text-decoration: underline">ﬀ</span>ectus: ille excludatur amicus  
  iam senior, cuius barbam tua ianua vidit.

</div>

Unicodeの合字は'Alphabetic Presentation Forms'というブロックに58字定義されている。
このうち僕がさしあたって必要とするのは以下の5文字だろう。

- <span style="font-family: 'EB Garamond'">ﬀ</span> - Unicode Character 'LATIN SMALL LIGATURE FF' (U+FB00)
- <span style="font-family: 'EB Garamond'">ﬁ</span> - Unicode Character 'LATIN SMALL LIGATURE FI' (U+FB01)
- <span style="font-family: 'EB Garamond'">ﬂ</span> - Unicode Character 'LATIN SMALL LIGATURE FL' (U+FB02)
- <span style="font-family: 'EB Garamond'">ﬃ</span> - Unicode Character 'LATIN SMALL LIGATURE FFI' (U+FB03)
- <span style="font-family: 'EB Garamond'">ﬄ</span> - Unicode Character 'LATIN SMALL LIGATURE FFL' (U+FB04)

フォントの表示方法を細かく設定するプロパティとしては、font-feature-settingsというプロパティや、font-variant-で始まる複数のプロパティもあるが、
たいていの場合は、`text-rendering: optimizeLegibility`を指定すればとりあえず用は足りるだろう。

[^1]: text-renderingのサポート状況については、[text-rendering - CSS|MDN](https://developer.mozilla.org/ja/docs/Web/CSS/text-rendering#Browser_Compatibility)を参照。
