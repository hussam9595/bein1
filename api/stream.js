import fetch from 'node-fetch'; // استيراد مكتبة node-fetch لعمل طلبات HTTP

async function getDynamicM3u8Url() {
    // -------------------------------------------------------------------------------------------------
    //  !!! هذا هو المكان الذي تضع فيه الرابط الفعلي لمصدر M3U8 !!!
    //  استبدل "ضع_هنا_الرابط_الحقيقي_للمصدر_الديناميكي_لـ_M3U8.m3u8"
    //  بالرابط الذي تستخدمه حاليًا والذي يعطيك محتوى M3U8 المتغير.
    //  مثال: إذا كان الرابط الحقيقي هو "https://example.com/live/my_actual_stream.m3u8"
    //  فقم بوضعه هنا.
    //  إذا كان الرابط نفسه يتغير، فهذا الجزء يحتاج إلى منطق برمجي معقد
    //  لاكتشافه في كل مرة (كما ذكرنا في الخطوة 1).
    //  ولكن في معظم الحالات، يكون هناك رابط ثابت للملف الرئيسي M3U8،
    //  بينما تتغير روابط المقاطع بداخله.
    // -------------------------------------------------------------------------------------------------
    return "https://www.zamaykas.shop/x1/live_stream_master.m3u8"; // مثال: رابط ثابت يولد M3U8 ديناميكي
    //  **ملاحظة هامة:** إذا كان هذا الرابط (https://www.zamaykas.shop/x1/live_stream_master.m3u8)
    //  هو بالفعل الرابط الذي تحصل منه على محتوى M3U8 الذي أرسلته لي (والذي يحتوي على .js URLs)،
    //  فيمكنك تركه كما هو. ولكن إذا كان هذا مجرد تخمين مني، فيجب عليك استبداله.
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const dynamicM3u8Url = await getDynamicM3u8Url();

        const response = await fetch(dynamicM3u8Url, {
            headers: {
                // يمكنك إضافة أي رؤوس (Headers) قد تكون ضرورية للمصدر الأصلي هنا
                // مثال: 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                // 'Referer': 'https://www.zamaykas.shop/'
            }
        });

        if (!response.ok) {
            console.error(`Failed to fetch M3U8 from ${dynamicM3u8Url}: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            return res.status(response.status).send(`Error from source: ${response.statusText || errorText}`);
        }

        let m3u8Content = await response.text();

        // **اختياري:** معالجة محتوى M3U8 وإعادة كتابة روابط المقاطع
        // هذا الجزء يصبح ضروريًا إذا كانت روابط المقاطع (مثل .js) لا تعمل مباشرة
        // وتحتاج إلى أن تمر عبر Vercel Proxy أيضًا.
        // إذا كانت تعمل مباشرة من المصدر، يمكنك حذف هذا الجزء.
        /*
        const vercelAppDomain = req.headers.host;
        const originalSegmentsBaseUrl = "https://www.zamaykas.shop/x1/"; // هذا يجب أن يكون الرابط الأساسي لمقاطع الفيديو الأصلية
        const proxySegmentsBaseUrl = `https://${vercelAppDomain}/api/segments/`; // هذا هو رابط الوسيط الخاص بك

        // قم باستبدال الروابط في محتوى M3U8
        m3u8Content = m3u8Content.replace(new RegExp(originalSegmentsBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), proxySegmentsBaseUrl);

        // ملاحظة: إذا قمت بتفعيل هذا، ستحتاج لإنشاء ملف api/segments.js جديد
        // ليعمل كوسيط لمقاطع الفيديو الفعلية.
        */

        res.setHeader('Content-Type', 'application/x-mpegURL');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.status(200).send(m3u8Content);

    } catch (error) {
        console.error('Error in Vercel function:', error);
        res.status(500).send(`Error processing stream: ${error.message}`);
    }
}
