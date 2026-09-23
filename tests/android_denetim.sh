#!/usr/bin/env bash
# android/ projesinin Android SDK olmadan yapilabilen denetimi (bu ortamda dl.google.com
# kapali, APK derlenemiyor). Gercek derleme Android Studio'da yapilir.
#  1. XML dosyalari bicimce dogru mu (orn. yorumda "--" yasak; bu depoda oldu)
#  2. Kaynak baglantilari (@layout/.., @drawable/..) gercekten var mi
#  3. Java kodu Android 14 siniflarina (Robolectric android-all, Maven Central) karsi derleniyor mu
#  4. Hatirlatici.sonraki: bir sonraki calma ani (tests/android/SonrakiDene.java)
set -u
cd "$(dirname "$0")/.."
ONBELLEK="${HOME}/.cache/halka"; mkdir -p "$ONBELLEK"
JAR="$ONBELLEK/android-all-14.jar"
if [ ! -s "$JAR" ]; then
  echo "android-all (Android 14 siniflari, ~130 MB) indiriliyor..."
  curl -sSfL -o "$JAR" https://maven-central.storage-download.googleapis.com/maven2/org/robolectric/android-all/14-robolectric-10818077/android-all-14-robolectric-10818077.jar \
    || curl -sSfL -o "$JAR" https://repo.maven.apache.org/maven2/org/robolectric/android-all/14-robolectric-10818077/android-all-14-robolectric-10818077.jar \
    || { echo "KALDI android-all indirilemedi"; exit 1; }
fi
fail=0
for f in $(find android -name '*.xml' -not -path '*/build/*'); do
  python3 -c "import xml.dom.minidom,sys;xml.dom.minidom.parse(sys.argv[1])" "$f" 2>/dev/null || { echo "KALDI bozuk XML: $f"; fail=1; }
done
[ $fail = 0 ] && echo "GECTI XML bicimi"
TMP=$(mktemp -d)
python3 tests/android/r_uret.py android "$TMP/r" || fail=1
if javac --release 17 -nowarn -encoding UTF-8 -cp "$JAR" -d "$TMP/c" "$TMP/r/com/halka/app/R.java" \
     android/app/src/main/java/com/halka/app/*.java 2>&1 | grep -E "error:|hata:" -A2; then
  echo "KALDI Java derlemesi"; fail=1
else
  echo "GECTI Java derlemesi (Android 14 siniflari)"
  mkdir -p "$TMP/t/com/halka/app"
  cp tests/android/HatirlaticiErisim.java "$TMP/t/com/halka/app/"
  cp tests/android/SonrakiDene.java "$TMP/t/"
  (cd "$TMP/t" && javac -nowarn -encoding UTF-8 -cp "$JAR:$TMP/c" -d . com/halka/app/HatirlaticiErisim.java SonrakiDene.java 2>&1 | grep "error:" ;
   java -cp "$JAR:$TMP/c:." SonrakiDene 2>&1 | grep -E "GECTI|KALDI|Sonuc") || true
  (cd "$TMP/t" && java -cp "$JAR:$TMP/c:." SonrakiDene >/dev/null 2>&1) || fail=1
fi
rm -rf "$TMP"
echo; [ $fail = 0 ] && echo "Sonuc: android denetimi gecti" || echo "Sonuc: android denetiminde KALDI var"
exit $fail
