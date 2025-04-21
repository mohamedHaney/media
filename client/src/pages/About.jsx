const About = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 rounded-lg shadow-lg my-10">
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">من نحن</h1>
            <p className="text-center text-gray-500 text-lg mb-6">
                مرحباً بك في "صقور المحاجر"، مشروع يهدف إلى تسليط الضوء على حياة عمال محاجر الطوب الأبيض، وإبراز دورهم الحيوي في قطاع البناء، مع التركيز على التحديات التي يواجهونها يومياً.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-semibold text-blue-600 mb-2">رؤيتنا</h2>
                    <p className="text-gray-700 leading-relaxed">
                        نطمح إلى رفع مستوى الوعي حول الظروف الصعبة التي يعمل فيها عمال المحاجر، وتسليط الضوء على جهودهم في بناء مستقبل مشرق. نؤمن بأن تسليط الضوء على هذه الفئة يسهم في تحسين أوضاعهم وتعزيز التقدير المجتمعي لهم.
                    </p>
                </div>
                
                <div>
                    <h2 className="text-2xl font-semibold text-blue-600 mb-2">هدفنا</h2>
                    <p className="text-gray-700 leading-relaxed">
                        هدفنا هو توثيق حياة العمال اليومية، إبراز قصصهم، وتقديم منصة توعوية تسلط الضوء على حقوقهم ومطالبهم. كما نعمل على تقديم محتوى يساهم في تعزيز الحوار حول تحسين بيئة العمل في هذا القطاع.
                    </p>
                </div>
            </div>
            
            <div className="mt-8">
                <h2 className="text-2xl font-semibold text-blue-600 mb-2">ماذا نقدم</h2>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                    <li>مقالات وتقارير توثق واقع حياة عمال المحاجر.</li>
                    <li>مقابلات حصرية مع العمال لعرض تجاربهم ورؤيتهم.</li>
                    <li>محتوى بصري يوضح طبيعة العمل في المحاجر وتأثيره على العمال.</li>
                </ul>
            </div>
            
            <div className="mt-8 text-center">
                <h2 className="text-2xl font-semibold text-blue-600 mb-4">كن جزءاً من رحلتنا</h2>
                <p className="text-gray-700 leading-relaxed">
                    ندعوك لاكتشاف قصص عمال المحاجر، والمساهمة في نشر الوعي حول دورهم وأوضاعهم. معًا، يمكننا تعزيز التقدير والدعم لهذه الفئة التي تبني حاضرنا ومستقبلنا.
                </p>
            </div>
        </div>
    );
};

export default About;
