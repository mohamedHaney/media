
const About = () => {
    return (
        <div className="max-w-4xl mx-auto p-6  rounded-lg shadow-lg my-10">
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">من نحن</h1>
            <p className="text-center text-gray-500 text-lg mb-6">
                مرحباً بك في رحلة الإعلام عبر الزمان نعمل على توفير منصة تفاعلية تستعرض تطور الإعلام عبر الزمن وتقدم محتوى ثري يلهم الجمهور للتفاعل مع الإعلام بوعي ومسؤولية.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-semibold text-blue-600 mb-2">رؤيتنا</h2>
                    <p className="text-gray-700 leading-relaxed">
                        في رحلة الإعلام عبر الزمان، نسعى إلى بناء مجتمع إعلامي واعٍ، يشجع على التفاعل المسؤول مع المعلومات ويعزز التفكير النقدي. نتطلع إلى سد الفجوة بين الماضي والحاضر عبر تقديم محتوى تفاعلي يبرز دور الإعلام في تشكيل المجتمع والثقافة.
                    </p>
                </div>
                
                <div>
                    <h2 className="text-2xl font-semibold text-blue-600 mb-2">هدفنا</h2>
                    <p className="text-gray-700 leading-relaxed">
                        هدفنا هو تمكين الجمهور من فهم تأثير الإعلام وتطوره عبر التاريخ، وتشجيع التفاعل البناء مع محتوى يجمع بين الأصالة والمعاصرة. نحن نؤمن بأن الإعلام يمكن أن يكون وسيلة قوية للتغيير الإيجابي.
                    </p>
                </div>
            </div>
            
            <div className="mt-8">
                <h2 className="text-2xl font-semibold text-blue-600 mb-2">ماذا نقدم</h2>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                    <li>مقالات وأبحاث حول تطور الإعلام وتأثيره في حياتنا اليومية.</li>
                    <li>محتوى تفاعلي يتيح للمستخدمين استكشاف التاريخ الإعلامي بأنفسهم.</li>
                    <li>ندوات وورش عمل عبر الإنترنت لتعزيز وعي الجمهور.</li>
                </ul>
            </div>

            <div className="mt-8 text-center">
                <h2 className="text-2xl font-semibold text-blue-600 mb-4">كن جزءاً من رحلتنا</h2>
                <p className="text-gray-700 leading-relaxed">
                    ندعوك لاستكشاف محتوى المشروع والمشاركة في رحلتنا لفهم الإعلام وتطوره. نحن نؤمن بأن كل فرد يمكنه أن يسهم في بناء وعي إعلامي أفضل، ونرحب بانضمامك إلينا!
                </p>
            </div>
        </div>
    );
};

export default About;
