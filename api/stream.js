import fetch from 'node-fetch'; // استيراد مكتبة node-fetch لعمل طلبات HTTP

// --- هام جدًا: هذا الجزء هو الذي يجب عليك تعديله ليناسب حالتك ---
//  هذه الدالة هي التي ستكتشف أحدث رابط M3U8 الديناميكي من المصدر الأصلي.
//  يجب أن تحتوي على المنطق الذي اكتشفته في "الخطوة 1: اكتشاف رابط M3U8 الديناميكي".
//  مثال: قد تحتاج إلى عمل طلب HTTP لموقع ويب معين، أو تحليل HTML، أو استدعاء API.
async function getDynamicM3u8Url() {
    // -------------------------------------------------------------------------------------------------
    //  !!! استبدل هذا المنطق بالمنطق الفعلي لاكتشاف الرابط الديناميكي !!!
    //  إذا كنت تحصل على رابط متغير من صفحة معينة، فقد تحتاج إلى جلب تلك الصفحة وتحليلها.
    //  مثال (تخيلي):
    //  const webpageResponse = await fetch('https://example.com/live-page');
    //  const webpageContent = await webpageResponse.text();
    //  // قم بتحليل webpageContent للعثور على الرابط الديناميكي
    //  const regexMatch = webpageContent.match(/some_regex_to_find_m3u8_url\("([^"]+)"\)/);
    //  if (regexMatch && regexMatch[1]) {
    //      return regexMatch[1];
    //  }
    //  throw new Error("Could not find dynamic M3U8 URL from source page.");
    // -------------------------------------------------------------------------------------------------

    // بما أنك قدمت لي محتوى M3U8، سأفترض مؤقتًا أن هناك "رابط مصدر ثابت"
    // يولد هذا المحتوى المتغير داخليًا. إذا كان الرابط نفسه يتغير،
    // فالمنطق أعلاه (المعلق) هو ما تحتاجه حقًا.
    // **ملاحظة:** سأضع هنا رابطًا افتراضيًا كمثال **للمصدر الذي تطلب منه M3U8**
    // لأنه يجب أن يكون ثابتًا في هذا السياق.
    // إذا كنت لا تملك هذا الرابط الثابت الذي يولد الاستجابة، فعليك إيجاده.
    return "https://www.zamaykas.shop/x1/live_stream_master.m3u8"; // مثال: رابط ثابت يولد M3U8 ديناميكي
}
// ----------------------------------------------------------------------


export default async function handler(req, res) {
    // التأكد من أن الطلبات هي GET (أو حسب الحاجة)
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const dynamicM3u8Url = await getDynamicM3u8Url();

        // جلب محتوى M3U8 من المصدر الديناميكي
        const response = await fetch(dynamicM3u8Url, {
            headers: {
                // إضافة رؤوس (Headers) قد تكون ضرورية للمصدر الأصلي.
                // بعض المواقع تتطلب User-Agent معين، أو Referer.
                // يمكنك نسخ هذه الرؤوس من طلب المتصفح الأصلي الذي ينجح في جلب M3U8.
                // مثال:
                // 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                // 'Referer': 'https://www.zamaykas.shop/' // إذا كان المصدر يتطلب Referer
            }
        });

        // التحقق من أن الاستجابة ناجحة (حالة 200)
        if (!response.ok) {
            console.error(`Failed to fetch M3U8 from ${dynamicM3u8Url}: ${response.status} ${response.statusText}`);
            // محاولة تمرير رسالة الخطأ من المصدر إذا كانت متوفرة
            const errorText = await response.text();
            return res.status(response.status).send(`Error from source: ${response.statusText || errorText}`);
        }

        let m3u8Content = await response.text();

        // --- معالجة محتوى M3U8 (إعادة كتابة الروابط إذا لزم الأمر) ---
        // هذا الجزء يصبح ضروريًا إذا كانت روابط المقاطع داخل M3U8 (مثل https://www.zamaykas.shop/x1/1139513202332110.js)
        // لا تعمل مباشرة من طرف المشغل وتحتاج إلى أن تمر عبر Vercel Proxy أيضًا.
        // إذا كانت تعمل مباشرة، يمكنك حذف هذا الجزء المعقد.
        //
        // إذا كنت تحتاج لعمل Proxy للمقاطع أيضاً:
        // ستحتاج إلى دالة Vercel إضافية (مثلاً في api/segments.js) لمعالجة طلبات المقاطع.
        // وستقوم هنا بتغيير روابط المقاطع لتشير إلى تلك الدالة الجديدة.
        // اسم التطبيق الخاص بك على Vercel سيكون متاحاً بعد النشر (مثلاً my-m3u8-proxy.vercel.app)
        //
        // const vercelAppDomain = req.headers.host; // سيعطيك something.vercel.app
        // const originalSegmentsBaseUrl = "https://www.zamaykas.shop/x1/";
        // const proxySegmentsBaseUrl = `https://${vercelAppDomain}/api/segments/`;
        //
        // m3u8Content = m3u8Content.replace(new RegExp(originalSegmentsBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), proxySegmentsBaseUrl);
        //
        // ملاحظة: إذا قمت بتفعيل هذا، ستحتاج لإنشاء ملف api/segments.js جديد
        // ليعمل كوسيط لمقاطع الفيديو الفعلية.

        // إعداد الرؤوس (Headers) المناسبة للاستجابة
        res.setHeader('Content-Type', 'application/x-mpegURL'); // مهم جدًا
        res.setHeader('Access-Control-Allow-Origin', '*');      // السماح بالوصول من أي مصدر (CORS)
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // منع التخزين المؤقت
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // إرسال محتوى M3U8 المعدل (أو الأصلي إذا لم يتم تعديله)
        res.status(200).send(m3u8Content);

    } catch (error) {
        console.error('Error in Vercel function:', error);
        res.status(500).send(`Error processing stream: ${error.message}`);
    }
}
