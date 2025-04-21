import { Footer } from "flowbite-react";
import { BsFacebook, BsInstagram, BsTwitter, BsGithub, BsDribbble } from 'react-icons/bs';
import { Link } from 'react-router-dom';


export default function FooterCom() {
  return (
<footer className="bg-white dark:bg-gray-900 border-t-8 border-teal-500">
    <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
        <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
                <Link href="/" className="flex items-center">
                <span className='px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white'>
  {" صقور المحاجر "}
</span>
                    <span className="ml-2 text-lg sm:text-xl font-semibold whitespace-nowrap dark:text-white">
                    </span>
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
                <div>
                    <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">حول</h2>
                    <ul className="text-gray-500 dark:text-gray-400 font-medium">
                        <li className="mb-4">
                            <Link to="/our-vision" target="_self" rel="noopener noreferrer" className="hover:underline">رؤيتنا</Link>
                        </li>
                        <li>
                            <Link to="/about" target="_self" rel="noopener noreferrer" className="hover:underline">صقور المحاجر</Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">تابعنا</h2>
                    <ul className="text-gray-500 dark:text-gray-400 font-medium">
                        <li className="mb-4">
<a 
  href="https://www.facebook.com/profile.php?id=61573389843203&locale=ar_AR" 
  className="hover:underline">
  الفيسبوك
</a>
                        </li>
                        <li>
                            <Link href="#" className="hover:underline">اليوتيوب</Link>
                        </li>
                    </ul>
                </div>
                <div>
                    <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">الحقوق</h2>
                    <ul className="text-gray-500 dark:text-gray-400 font-medium">
                        <li className="mb-4">
                            <Link href="/privacy-policy" className="hover:underline">سياية الخصوصية</Link>
                        </li>
                        <li>
                            <Link href="/terms-conditions" className="hover:underline">الشروط و الأحكام</Link>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
        <div className="sm:flex sm:items-center sm:justify-between">
        <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400"><Link href="#" className="hover:underline">صقور المحاجر</Link> جميع الحقوق محفوظة© 2025 </span>
        <div className="flex gap-6 sm:mt-0 mt-4 sm:justify-center">
            <Footer.Icon href='https://www.facebook.com/profile.php?id=61573389843203&locale=ar_AR' icon={BsFacebook}/>
            <Footer.Icon href='#' icon={BsInstagram}/>
            <Footer.Icon href='#' icon={BsTwitter}/>
            <Footer.Icon href='#' icon={BsGithub}/>
            <Footer.Icon href='#' icon={BsDribbble}/>
          </div>
        </div>
    </div>
</footer>
)}
