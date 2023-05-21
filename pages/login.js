import { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import Layout from '../components/layout';
import app from './api/firebaseConfig';
import jsCookie from 'js-cookie';

const Login = () => {

    jsCookie.remove('userEmail');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const router = useRouter();

    const handleChange = (e) => {
        setFormData((prevData) => ({
            ...prevData,
            [e.target.name]: e.target.value,
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const auth = getAuth(app);
            const { email, password } = formData;

            // Sign in the user with email and password
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if the login was successful
            if (user) {
                // Set the user token in a cookie
                jsCookie.set('userEmail', email, { expires: 1 });
                router.push('/dashboard'); // Redirect to the dashboard page
            }
        } catch (error) {
            alert('Incorrect Email or Password');
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        try {
            const auth = getAuth(app);
            const { email } = formData;

            // Send a password reset email to the user's email address
            await sendPasswordResetEmail(auth, email);

            alert('Password reset email sent. Please check your email inbox.');
        } catch (error) {
            alert('Error occurred while sending the password reset email. Make sure you put correct email address.');
        }
    };

    return (
        <Layout>
            <div className="flex justify-center items-center bg-gray-900">
                <div className="w-full max-w-lg">
                    <h1 className="text-2xl text-center text-white pt-4 mb-6">Login to JUKTI Funds</h1>
                    <form className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-6" onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                                type="email"
                                name="email"
                                id="email"
                                placeholder="Your Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                                type="password"
                                name="password"
                                id="password"
                                placeholder="Your Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="mt-8">
                            <button
                                className="bg-jukti-orange hover:bg-jukti-orange-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                                onClick={handleLogin}
                            >
                                Login
                            </button>
                        </div>
                        <div className="mt-4">
                            <button className="text-gray-300 text-sm underline hover:text-gray-400 focus:outline-none"
                                onClick={handleForgotPassword}
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Login;

