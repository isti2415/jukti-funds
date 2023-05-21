import Layout from '../components/layout';
import Link from 'next/link';

const Home = () => {
  return (
    <Layout>
      <div className="flex flex-col justify-center items-center pt-8">
          <p className="text-2xl text-gray-200 p-4 text-center">
            Welcome to the website for Jukti Fund Records.
          </p>
          <p className="text-2xl text-gray-200 text-center">
            Please login or register to continue.
          </p>
          <div className="flex flex-col justify-center space-y-8 mt-8">
            <Link href="/login">
            <button
                className="bg-jukti-orange hover:bg-jukti-orange-dark text-xl text-white font-bold py-4 px-16 rounded focus:outline-none focus:shadow-outline w-full">
                Login
              </button>
            </Link>
            <Link href="/register">
            <button
                className="bg-jukti-orange hover:bg-jukti-orange-dark text-xl text-white font-bold py-4 px-16 rounded focus:outline-none focus:shadow-outline w-full">
                Register
              </button>
            </Link>
          </div>
        </div>
    </Layout>
  );
};

export default Home;
