# android/ kaynaklarindan sahte R.java uretir (gercek derlemede aapt uretir) ve
# XML'lerdeki @tur/ad baglantilarinin gercekten var oldugunu denetler.
# Kullanim: python3 r_uret.py <android klasoru> <R.java cikis klasoru>
import os, re, sys, glob
kok, cikis = sys.argv[1], sys.argv[2]
res = os.path.join(kok, 'app/src/main/res'); tur = {}
def ekle(t, a): tur.setdefault(t, set()).add(a)
for d in os.listdir(res):
    t = d.split('-')[0]
    for f in os.listdir(os.path.join(res, d)):
        if t in ('layout', 'drawable', 'mipmap', 'xml'): ekle(t, f.split('.')[0])
        if f.endswith('.xml'):
            x = open(os.path.join(res, d, f), encoding='utf-8').read()
            for m in re.findall(r'@\+id/(\w+)', x): ekle('id', m)
            if t == 'values':
                for k, v in re.findall(r'<(string|color|style)\s+name="([\w.]+)"', x): ekle(k, v.replace('.', '_'))
eksik = []
for f in glob.glob(res + '/**/*.xml', recursive=True) + [os.path.join(kok, 'app/src/main/AndroidManifest.xml')]:
    for t, a in re.findall(r'@(layout|drawable|mipmap|xml|string|color|style)/([\w.]+)', open(f, encoding='utf-8').read()):
        if a.replace('.', '_') not in tur.get(t, ()): eksik.append(f + ': @' + t + '/' + a)
os.makedirs(os.path.join(cikis, 'com/halka/app'), exist_ok=True)
s = 'package com.halka.app;\npublic final class R {\n'; n = 0x7f000000
for t, adlar in sorted(tur.items()):
    s += '  public static final class %s {\n' % t
    for a in sorted(adlar): n += 1; s += '    public static final int %s=0x%x;\n' % (a, n)
    s += '  }\n'
open(os.path.join(cikis, 'com/halka/app/R.java'), 'w').write(s + '}\n')
for e in eksik: print('KALDI kaynak yok: ' + e)
print('GECTI kaynak baglantilari' if not eksik else '')
sys.exit(1 if eksik else 0)
