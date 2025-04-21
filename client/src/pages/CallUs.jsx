import { useState } from 'react';

const ContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = () => {
    if (!name || !email || !message) {
      setError('جميع الحقول مطلوبة');
      return;
    }
    
    const adminEmail = 'mohaney745@gmail.com';
    const subject = encodeURIComponent(name);
    const body = encodeURIComponent(message);

    // Clear input fields and messages
    setName('');
    setEmail('');
    setMessage('');
    setError('');
    setSuccess('تم إرسال رسالتك.');

    // Redirect to mailto link
    window.location.href = `mailto:${adminEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div> 
    <div  className="font-semibold text-4xl text-slate-500 mx-9 mt-3">أتصل بنا</div>
    <div dir="rtl" style={{ textAlign: 'right', margin:"5% 20%" }} className="p-4 bg-gray-200 rounded shadow-md">
      <div id="contact-form">
        <form name="contact-form" className="flex flex-col">
          <input
            className="contact-form-name mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 transition duration-200"
            id="ContactForm1_contact-form-name"
            name="name"
            placeholder="الاسم"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="contact-form-email mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 transition duration-200"
            id="ContactForm1_contact-form-email"
            name="email"
            placeholder="بريد إلكتروني"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            className="contact-form-email-message mb-4 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 transition duration-200"
            cols="25"
            id="ContactForm1_contact-form-email-message"
            name="email-message"
            placeholder="الرسالة"
            rows="5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <input
            id="ContactForm1_contact-form-submit"
            type="button"
            value="إرسال"
            className="text-xl bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600 cursor-pointer transition duration-200"
            onClick={handleSubmit}
          />
          {error && <div className="text-red-600 font-bold mt-2">{error}</div>}
          {success && <div className="text-green-600 font-bold mt-2">{success}</div>}
        </form>
      </div>
    </div>
    </div>
  );
};

export default ContactForm;
