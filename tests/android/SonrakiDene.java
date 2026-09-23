// Hatirlatici.sonraki: "SS:DD" saatinde, ISO gunlerinden (1=Pzt .. 7=Paz) bir sonraki an.
// tests/android_denetim.sh derleyip calistirir (Android SDK gerekmez).
import com.halka.app.*;
import org.json.JSONArray;
import java.text.SimpleDateFormat;
import java.util.*;
public class SonrakiDene {
  static SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd EEE HH:mm",new Locale("tr"));
  static int hata=0;
  static void dene(String ad,String simdi,String saat,String gunler,String bek) throws Exception{
    long s=new SimpleDateFormat("yyyy-MM-dd HH:mm").parse(simdi).getTime();
    long z=HatirlaticiErisim.sonraki(saat,new JSONArray(gunler),s);
    String c=z==0?"0":f.format(new Date(z));
    boolean ok=c.startsWith(bek); if(!ok)hata++;
    System.out.println((ok?"GECTI ":"KALDI ")+ad+"  beklenen="+bek+" cikan="+c);
  }
  public static void main(String[] a) throws Exception{
    // 2026-09-23 Carsamba
    dene("hafta ici, saat gecmis -> yarin","2026-09-23 10:00","09:00","[1,2,3,4,5]","2026-09-24");
    dene("hafta ici, saat gelecek -> bugun","2026-09-23 10:00","21:00","[1,2,3,4,5]","2026-09-23");
    dene("cuma aksami -> pazartesi","2026-09-25 22:00","21:00","[1,2,3,4,5]","2026-09-28");
    dene("yalniz hafta sonu","2026-09-23 10:00","09:00","[6,7]","2026-09-26");
    dene("yalniz pazar, pazar gecmis saat -> gelecek pazar","2026-09-27 10:00","09:00","[7]","2026-10-04");
    dene("yalniz pazartesi (ISO 1)","2026-09-23 10:00","08:30","[1]","2026-09-28");
    dene("tam su an -> gelecek hafta ayni gun","2026-09-23 09:00","09:00","[3]","2026-09-30");
    dene("bos gun listesi","2026-09-23 10:00","09:00","[]","0");
    dene("bozuk saat","2026-09-23 10:00","9","[1]","0");
    System.out.println(hata==0?"Sonuc: hepsi gecti":"Sonuc: "+hata+" KALDI");
    System.exit(hata);
  }
}
