import { Avatar, Button, Dropdown, Navbar, TextInput } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/theme/themeSlice';
import { signoutSuccess } from '../redux/user/userSlice';
import { useEffect, useState } from 'react';

export default function Header() {
  const path = useLocation().pathname;
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);

  const handleSignout = async () => {
    try {
      const res = await fetch(`/api/user/signout`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(data.message);
      } else {
        dispatch(signoutSuccess());
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('searchTerm', searchTerm);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
    setShowMobileSearch(false);
  };

  return (
    <Navbar className='border-b-2 sticky top-0 bg-white dark:bg-gray-800 z-50'>
      {/* Logo/Brand */}
      <Link
        to='/'
        className='self-center whitespace-nowrap text-sm sm:text-xl font-semibold dark:text-white'
      >
        <span className='px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white'>
          {" صقور المحاجر "}
        </span>
      </Link>

      {/* Desktop Search - Always visible on medium screens and up */}
      <form 
        onSubmit={handleSubmit} auth
        className='hidden md:flex flex-1 max-w-md mx-4'
      >
        <TextInput
          type='text'
          placeholder='ما الذي تبحث عنه...'
          rightIcon={AiOutlineSearch}
          className='w-full'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      {/* Right Side Controls */}
      <div className='flex gap-2 md:order-2'>


        {/* Mobile Search Toggle - Only shows on phones (below md breakpoint) */}
        <Button
          className='w-12 h-10 md:hidden'
          color='gray'
          pill
          onClick={() => setShowMobileSearch(!showMobileSearch)}
        >
          {showMobileSearch ? <AiOutlineClose /> : <AiOutlineSearch />}
        </Button>
        {/* Theme Toggle - Always visible */}
        <Button
          className='w-12 h-10'
          color='gray'
          pill
          onClick={() => dispatch(toggleTheme())}
        >
          {theme === 'light' ? <FaSun /> : <FaMoon />}
        </Button>
        {/* User Dropdown */}
        {currentUser ? (
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Avatar
                alt='user'
                img={
                  currentUser.profilePicture ||
                  'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                }
                rounded
              />
            }
          >
            <Dropdown.Header className='z-20'>
              <span className='block text-sm'>@{currentUser.username}</span>
              <span className='block text-sm font-medium truncate'>
                {currentUser.email}
              </span>
            </Dropdown.Header>
            <Link to={'/dashboard?tab=profile'}>
              <Dropdown.Item>الملف الشخصي</Dropdown.Item>
            </Link>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleSignout}>تسجيل خروج</Dropdown.Item>
          </Dropdown>
        ) : (
          <Link to='/sign-in'>
            <Button className='bg-gradient-to-r from-slate-600 to-indigo-800' outline>
              تسجيل دخول
            </Button>
          </Link>
        )}
        <Navbar.Toggle />
      </div>

      {/* Mobile Search - Only shows on phones when toggled */}
      {showMobileSearch && (
        <div className='absolute top-16 left-0 right-0 px-4 py-2 bg-white dark:bg-gray-800 shadow-md md:hidden'>
          <form onSubmit={handleSubmit} className='flex gap-2'>
            <TextInput
              type='text'
              placeholder='ما الذي تبحث عنه...'
              className='flex-1'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <Button type='submit' className='bg-gradient-to-r from-purple-500 to-blue-500'>
              بحث
            </Button>
          </form>
        </div>
      )}

      {/* Navigation Links */}
      <Navbar.Collapse>
        <Navbar.Link className='ml-8' active={path === '/'} as={'div'}>
          <Link to='/'>الرئيسية</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/about'} as={'div'}>
          <Link to='/about'>من نحن</Link>
        </Navbar.Link>
        <Navbar.Link active={path === '/projects'} as={'div'}>
          <Link to='/projects'>اتصل بنا</Link>
        </Navbar.Link>
      </Navbar.Collapse>
    </Navbar>
  );
}