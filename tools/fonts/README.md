# Fonts

`JetBrainsMono-*.subset.woff2` are subsets of [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono)
(Copyright 2020 JetBrains s.r.o.), distributed under the Apache License 2.0 — see `LICENSE-Apache-2.0.txt`.

They contain printable ASCII, Turkish letters and the handful of symbols the cards use, which keeps each
weight around 5 KB once inlined. To regenerate (requires `fonttools` and `brotli`):

```bash
TEXT="$(python3 -c "print(''.join(map(chr, range(32, 127))) + 'ğĞüÜşŞıİöÖçÇâÂîÎûÛ·—–→←↑↓↔▸▪■●○❯█…✓×≈°')")"
for w in Regular Bold ExtraBold; do
  pyftsubset "JetBrainsMono-$w.ttf" --text="$TEXT" --flavor=woff2 --layout-features='' \
    --no-hinting --desubroutinize --output-file="JetBrainsMono-$w.subset.woff2"
done
```
