import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout';
import { getAuth, onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import { getDatabase, ref, onValue, set, update, orderByChild, equalTo, push, remove, get, query, off } from 'firebase/database';
import app from './api/firebaseConfig';
import { Disclosure } from '@headlessui/react';
import jsCookie from 'js-cookie';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';

const localizer = momentLocalizer(moment);

const Dashboard = () => {

    const router = useRouter();

    const auth = getAuth(app); // Get the authentication instance

    const [isMenuExpanded, setIsMenuExpanded] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState('Payment');
    const [isAdmin, setIsAdmin] = useState(false); // Default value set to false
    const [department, setDepartment] = useState("");
    const [position, setPosition] = useState("");

    const toggleMenu = () => {
        setIsMenuExpanded((prevIsMenuExpanded) => !prevIsMenuExpanded);
    };

    const handleMenuSelection = (menu) => {
        setSelectedMenu(menu);
        setIsMenuExpanded(false);
    };

    useEffect(() => {
        const fetchUserIsAdmin = (email) => {
            const db = getDatabase(app);
            const usersRef = ref(db, 'users');

            onValue(usersRef, (snapshot) => {
                const users = snapshot.val();
                if (users) {
                    const isAdmin = Object.values(users).find((user) => user.email === email)?.isAdmin || false;
                    setIsAdmin(isAdmin);
                    setDepartment(Object.values(users).find((user) => user.email === email)?.department);
                    setPosition(Object.values(users).find((user) => user.email === email)?.position);
                }
            });
        };

        try {
            // Assuming you have stored isAdmin field in the user document
            // Retrieve the authenticated user's data
            const email = jsCookie.get('userEmail');

            // Fetch isAdmin value from the database based on the user's email
            fetchUserIsAdmin(email);
        } catch (error) {
            // Handle any errors that occur during fetching user data
            alert('Error fetching user data:', error);
        }

        // Listen to changes in authentication state
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const email = user.email;

                // Fetch the isAdmin status from the Realtime Database
                fetchUserIsAdmin(email);
            } else {
                //Remove the user cookie
                jsCookie.remove('userEmail');
                // Handle the case when the user is not authenticated
                router.push('/login');
            }
        });

        if (selectedMenu === 'logout') {
            // Handle logout action
            signOut(auth)
                .then(() => {
                    // Remove the user cookie
                    jsCookie.remove('userEmail');
                    router.push('/login'); // Redirect to the login page
                })
                .catch((error) => {
                    alert('Error logging out:', error);
                });
        }

        return () => {
            unsubscribe(); // Unsubscribe the listener on component unmount
        };

    }, [selectedMenu, router, auth]);

    if (jsCookie.get("userEmail")) {
        return (
            <Layout>
                <div className={`floating-menu-icon ${isMenuExpanded ? 'open' : ''}`} onClick={toggleMenu}>
                    <svg
                        className="h-8 w-8 fill-current text-jukti-orange"
                        style={{ zIndex: 1000 }}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                    >
                        <path d="M4 6H20V8H4V6ZM4 11H20V13H4V11ZM4 16H20V18H4V16Z" />
                    </svg>
                </div>
                <div className="flex overflow-x-hidden">
                    <div
                        className={`bg-gray-800 fixed top-10 min-h-screen right-0 ${isMenuExpanded ? 'w-64' : 'w-0'
                            } transition-width duration-300 overflow-y-auto transition-all ease-in-out`}
                        style={{ zIndex: 999 }}
                    >
                        {/* Menu content */}
                        {isMenuExpanded && (
                            <ul className="mt-8">
                                <li
                                    className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'Payment' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                        }`}
                                    onClick={() => handleMenuSelection('Payment')}
                                >
                                    <span className="text-white">Make Payment</span>
                                </li>
                                <li
                                    className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'PaymentMethod' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                        }`}
                                    onClick={() => handleMenuSelection('PaymentMethod')}
                                >
                                    <span className="text-white">Payment Methods</span>
                                </li>
                                <li
                                    className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'PaymentHistory' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                        }`}
                                    onClick={() => handleMenuSelection('PaymentHistory')}
                                >
                                    <span className="text-white">Payment History</span>
                                </li>
                                {isAdmin ? (
                                    <li
                                        className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'allpayment' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                            }`}
                                        onClick={() => handleMenuSelection('allpayment')}
                                    >
                                        <span className="text-white">All Payments</span>
                                    </li>
                                ) : null}
                                {isAdmin ? (
                                    <li
                                        className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'pendingpayment' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                            }`}
                                        onClick={() => handleMenuSelection('pendingpayment')}
                                    >
                                        <span className="text-white">Pending Payments</span>
                                    </li>
                                ) : null}
                                {isAdmin ? (
                                    <li
                                        className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'reports' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                            }`}
                                        onClick={() => handleMenuSelection('reports')}
                                    >
                                        <span className="text-white">Reports</span>
                                    </li>
                                ) : null}
                                <li
                                    className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'calender' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                        }`}
                                    onClick={() => handleMenuSelection('calender')}
                                >
                                    <span className="text-white">Event Calender</span>
                                </li>
                                {isAdmin ? (
                                    <li
                                        className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'users' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                            }`}
                                        onClick={() => handleMenuSelection('users')}
                                    >
                                        <span className="text-white">Users</span>
                                    </li>
                                ) : null}
                                <li
                                    className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'profile' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                        }`}
                                    onClick={() => handleMenuSelection('profile')}
                                >
                                    <span className="text-white">Profile</span>
                                </li>
                                {isAdmin ? (
                                    <li
                                        className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'settings' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                            }`}
                                        onClick={() => handleMenuSelection('settings')}
                                    >
                                        <span className="text-white">Settings</span>
                                    </li>
                                ) : null}
                                <li
                                    className={`py-2 pl-4 cursor-pointer ${selectedMenu === 'logout' ? 'bg-jukti-orange' : 'hover:bg-gray-800'
                                        }`}
                                    onClick={() => handleMenuSelection('logout')}
                                >
                                    <span className="text-white">Logout</span>
                                </li>
                            </ul>
                        )}
                    </div>
                    <div className=" bg-gray-900 min-h-full mb-4">
                        {selectedMenu === 'Payment' && <PaymentContent handleMenuSelection={handleMenuSelection} />}
                        {selectedMenu === 'PaymentMethod' && <PaymentMethodContent />}
                        {selectedMenu === 'PaymentHistory' && <PaymentHistoryContent />}
                        {selectedMenu === 'profile' && <ProfileContent />}
                        {selectedMenu === 'allpayment' && <AllPaymentContent />}
                        {selectedMenu === 'reports' && <ReportsContent />}
                        {selectedMenu === 'calender' && <CalenderContent department={department} isAdmin={isAdmin} />}
                        {selectedMenu === 'settings' && <SettingsContent />}
                        {selectedMenu === 'users' && <UsersContent />}
                        {selectedMenu === 'pendingpayment' && <PendingPaymentContent />}
                    </div>
                </div>
            </Layout>
        );
    }
};

const PaymentContent = ({ handleMenuSelection }) => {
    const auth = getAuth(app);
    const db = getDatabase(app);

    const [duplicate, setDuplicate] = useState(false);
    const [trxDuplicate, setTrxDuplicate] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);

    const [paymentData, setPaymentData] = useState({
        month: '',
        year: '',
        paymentMethod: '',
        number: '',
        transactionId: '',
        amount: '',
        status: 'Pending',
        emailMonthYearStatus: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPaymentData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (duplicate) {
            alert('Payment for this month already done.');
        } else if (trxDuplicate) {
            alert('Transaction ID already exists.');
        }
        else {
            // Save paymentData to the database
            savePaymentData(paymentData);
            // Reset the form
            setPaymentData({
                month: '',
                year: '',
                paymentMethod: '',
                number: '',
                transactionId: '',
                amount: '',
                status: 'Pending',
                emailMonthYearStatus: '',
            });
        }
    };

    useEffect(() => {
        const checkExistingRecord = (month, year, status) => {
            const paymentsRef = ref(db, 'payments');
            const compositeKey = `${jsCookie.get("userEmail")}_${month}_${year}_${status}`;
            const paymentQuery = query(paymentsRef, orderByChild('emailMonthYearStatus'), equalTo(compositeKey));

            onValue(paymentQuery, (snapshot) => {
                const payments = snapshot.val();
                if (payments) {
                    setDuplicate(true);
                }
                else {
                    setDuplicate(false);
                }
            });
        };
        const checkExisting = (transactionId) => {
            const paymentsRef = ref(db, 'payments');
            const trxQuery = query(paymentsRef, orderByChild('transactionId'), equalTo(transactionId));
            onValue(trxQuery, (snapshot) => {
                const trxpayments = snapshot.val();
                if (trxpayments) {
                    setTrxDuplicate(true);
                }
                else {
                    setTrxDuplicate(false);
                }
            });
        };
        checkExistingRecord(paymentData.month, paymentData.year, paymentData.status);
        checkExisting(paymentData.transactionId);

        const paymentMethodsRef = ref(db, 'paymentMethods');
        onValue(paymentMethodsRef, (snapshot) => {
            const paymentMethodsData = snapshot.val();
            const paymentMethodsList = [];
            snapshot.forEach((childSnapshot) => {
                const paymentMethod = {
                    id: childSnapshot.key,
                    name: childSnapshot.val().name,
                    description: childSnapshot.val().description,
                };
                paymentMethodsList.push(paymentMethod);
            });
            setPaymentMethods(paymentMethodsList);
        });

    }, [jsCookie.get("userEmail"), db, paymentData.month, paymentData.status, paymentData.year]);

    const savePaymentData = (paymentData) => {
        paymentData.emailMonthYearStatus = `${jsCookie.get("userEmail")}_${paymentData.month}_${paymentData.year}_${paymentData.status}`;
        const paymentsRef = ref(db, 'payments');
        push(paymentsRef, {
            ...paymentData,
            email: jsCookie.get("userEmail"),
        });
    };

    return (
        <div className='max-w-6xl grid w-screen grid-cols-1 pr-8'>
            <div className="flex justify-between items-center">
                <h2 className="text-2xl text-white">Make Payment</h2>
                <button
                    class="bg-jukti-orange hover:bg-jukti-orange-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block ml-4"
                    onClick={() => handleMenuSelection('PaymentMethod') && <PaymentMethodContent />}
                >
                    Payment Methods
                </button>
            </div>
            <form className="gap-4 py-16 justify-start rounded-lg" onSubmit={handleFormSubmit}>
                <div className='grid grid-cols-2 justify-between gap-4'>
                    <div className="mb-4">
                        <label htmlFor="month" className="block text-gray-300 text-sm font-bold mb-2">
                            Payment Month
                        </label>
                        <select
                            id="month"
                            value={paymentData.month}
                            onChange={(e) =>
                                setPaymentData((prevData) => ({
                                    ...prevData,
                                    month: e.target.value,
                                }))
                            }
                            required
                            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="">Select Month</option>
                            <option value="January">January</option>
                            <option value="February">February</option>
                            <option value="March">March</option>
                            <option value="April">April</option>
                            <option value="May">May</option>
                            <option value="June">June</option>
                            <option value="July">July</option>
                            <option value="August">August</option>
                            <option value="September">September</option>
                            <option value="October">October</option>
                            <option value="November">November</option>
                            <option value="December">December</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="year" className="block text-gray-300 text-sm font-bold mb-2">
                            Payment Year
                        </label>
                        <select
                            id="year"
                            value={paymentData.year}
                            onChange={(e) =>
                                setPaymentData((prevData) => ({
                                    ...prevData,
                                    year: e.target.value,
                                }))
                            }
                            required
                            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                        >
                            <option value="">Select Year</option>
                            {Array.from({ length: 6 }).map((_, index) => {
                                const year = new Date().getFullYear() - index;
                                return <option key={year} value={year}>{year}</option>;
                            })}
                        </select>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="paymentMethod">
                        Payment Method
                    </label>
                    <select
                        className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                        name="paymentMethod"
                        id="paymentMethod"
                        value={paymentData.paymentMethod}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Payment Method</option>
                        {paymentMethods.map((paymentMethod) => (
                            <option key={paymentMethod.id} value={paymentMethod.name}>
                                {paymentMethod.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="number">
                        Number
                    </label>
                    <input
                        className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        name="number"
                        id="number"
                        value={paymentData.number}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="transactionId">
                        Transaction ID
                    </label>
                    <input
                        className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        name="transactionId"
                        id="transactionId"
                        placeholder='Last 5 Digits of Transaction ID'
                        value={paymentData.transactionId}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="amount">
                        Amount
                    </label>
                    <input
                        className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                        type="text"
                        name="amount"
                        id="amount"
                        value={paymentData.amount}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <button
                        className="bg-jukti-orange hover:bg-jukti-orange-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                        type="submit"
                    >
                        Record Payment
                    </button>
                </div>
            </form>
        </div>
    );
};

const PaymentMethodContent = () => {
    const [paymentMethods, setPaymentMethods] = useState([]);

    useEffect(() => {
        const db = getDatabase(app);
        const paymentMethodsRef = ref(db, 'paymentMethods');
        onValue(paymentMethodsRef, (snapshot) => {
            const paymentMethodsData = snapshot.val();
            const paymentMethodsList = [];
            snapshot.forEach((childSnapshot) => {
                const paymentMethod = {
                    id: childSnapshot.key,
                    name: childSnapshot.val().name,
                    description: childSnapshot.val().description.replace(/\n/g, '<br>'),
                };
                paymentMethodsList.push(paymentMethod);
            });
            setPaymentMethods(paymentMethodsList);
        });
    }, []);

    return (
        <div className='max-w-6xl grid w-screen grid-cols-1 pr-8'>
            <h2 className="text-2xl text-white mb-6">Payment Methods</h2>
            {paymentMethods.length > 0 ? (
                paymentMethods.map((paymentMethod) => (
                    <div key={paymentMethod.id} className="">
                        <Disclosure className="">
                            {({ open }) => (
                                <>
                                    <Disclosure.Button className="flex flex-auto justify-center bg-jukti-orange hover:bg-jukti-orange-dark w-full text-white font-bold py-4 my-4 px-4 rounded focus:outline-none focus:shadow-outline">
                                        <h3 className="text-xl">{paymentMethod.name}</h3>
                                    </Disclosure.Button>
                                    <Disclosure.Panel className="px-4 pt-4 pb-2 text-white text-lg">
                                        <div className="formatted-text" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: paymentMethod.description }}></div>
                                    </Disclosure.Panel>
                                </>
                            )}
                        </Disclosure>
                    </div>
                ))
            ) : (
                <p className="text-white">No payment methods found.</p>
            )}
        </div>
    );
};

const PendingPaymentContent = () => {
    const [pendingPayments, setPendingPayments] = useState([]);

    useEffect(() => {
        const db = getDatabase(app);
        const paymentsRef = ref(db, 'payments');

        const fetchPendingPayments = (snapshot) => {
            if (snapshot.exists()) {
                const paymentsData = snapshot.val();
                const pendingPayments = Object.entries(paymentsData)
                    .filter(([_, payment]) => payment.status === 'Pending')
                    .map(([id, payment]) => ({ id, ...payment }));
                setPendingPayments(pendingPayments);
            } else {
                setPendingPayments([]);
            }
        };

        const listener = onValue(paymentsRef, fetchPendingPayments);

        return () => {
            off(paymentsRef, 'value', listener);
        };
    }, []);

    const handleAccept = (paymentId) => {
        const db = getDatabase(app);
        const paymentRef = ref(db, `payments/${paymentId}`);
        update(paymentRef, { status: 'Accepted' })
            .then(() => {
                const updatedPayments = pendingPayments.map((payment) => {
                    if (payment.id === paymentId) {
                        return {
                            ...payment,
                            status: 'Accepted',
                        };
                    }
                    return payment;
                });
                const payments = updatedPayments.filter(
                    (payment) => payment.id !== paymentId
                );
                setPendingPayments(payments);
            })
            .catch((error) => {
                console.log('Error accepting payment:', error);
            });
    };

    const handleReject = (paymentId) => {
        const db = getDatabase(app);
        const paymentRef = ref(db, `payments/${paymentId}`);
        update(paymentRef, { status: 'Rejected' })
            .then(() => {
                const updatedPayments = pendingPayments.map((payment) => {
                    if (payment.id === paymentId) {
                        return {
                            ...payment,
                            status: 'Rejected',
                        };
                    }
                    return payment;
                });
                const payments = updatedPayments.filter(
                    (payment) => payment.id !== paymentId
                );
                setPendingPayments(payments);
            })
            .catch((error) => {
                console.log('Error rejecting payment:', error);
            });
    };


    return (
        <div className='max-w-6xl grid w-screen grid-cols-1 pr-8'>
            <h2 className="text-2xl text-white mb-6">Pending Payments</h2>
            {pendingPayments.length > 0 ? (
                <div className="overflow-x-auto">
                    <div className="max-w-full mx-auto">
                        <table className="block">
                            <thead>
                                <tr>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">User</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Payment Method</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Number</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Transaction ID</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Month</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Year</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Amount</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="text-white py-2 px-4 border-b">{payment.email}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.paymentMethod}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.number}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.transactionId}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.month}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.year}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.amount} BDT</td>
                                        <td className="text-white py-2 px-4 border-b">
                                            <button
                                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline mr-2 mb-2"
                                                onClick={() => handleAccept(payment.id)}
                                            >
                                                Accept
                                            </button>
                                            <button
                                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                                                onClick={() => handleReject(payment.id)}
                                            >
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <p className="text-white">No pending payments found.</p>
            )}

        </div>
    );
};

const AllPaymentContent = () => {
    const [payments, setPayments] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        // Fetch all payment records from the database
        const fetchAllPayments = () => {
            const db = getDatabase(app);
            const paymentsRef = ref(db, 'payments');

            onValue(paymentsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const paymentsData = snapshot.val();
                    const allPayments = Object.entries(paymentsData)
                        .filter(([_, payment]) => payment.status === 'Accepted')
                        .map(([id, payment]) => ({ id, ...payment }));
                    setPayments(allPayments);
                } else {
                    setPayments([]);
                }
            });
        };

        fetchAllPayments();
    }, []);

    useEffect(() => {
        // Fetch all users from the database
        const fetchAllUsers = () => {
            const db = getDatabase(app);
            const usersRef = ref(db, 'users');

            onValue(usersRef, (snapshot) => {
                if (snapshot.exists()) {
                    const usersData = snapshot.val();
                    const allUsers = Object.entries(usersData).map(([id, user]) => ({ id, ...user }));
                    setAllUsers(allUsers);
                } else {
                    setAllUsers([]);
                }
            });
        };

        fetchAllUsers();
    }, []);


    const handleSearchUser = (e) => {
        setSelectedUser(e.target.value);
    };

    const handleFilter = () => {
        // Filter payments based on selected month, year, and user
        let filteredPayments = [...payments];
        let filteredUser = [...allUsers];

        if (selectedMonth !== '') {
            filteredPayments = filteredPayments.filter((payment) => payment.month === selectedMonth);
        }

        if (selectedYear !== '') {
            filteredPayments = filteredPayments.filter((payment) => payment.year === selectedYear);
        }

        if (selectedUser !== '') {
            filteredUser = filteredUser.filter((user) => user.name === selectedUser);
            filteredPayments = filteredPayments.filter((payment) => payment.email === filteredUser[0].email);
        }

        // Set the filtered payments
        setPayments(filteredPayments);
    };

    const handleResetFilter = () => {
        setSelectedMonth('');
        setSelectedYear('');
        setSelectedUser('');
        // Fetch all payments to reset the view
        const fetchAllPayments = () => {
            const db = getDatabase(app);
            const paymentsRef = ref(db, 'payments');

            onValue(paymentsRef, (snapshot) => {
                if (snapshot.exists()) {
                    const paymentsData = snapshot.val();
                    const allPayments = Object.entries(paymentsData)
                        .filter(([_, payment]) => payment.status === 'Accepted')
                        .map(([id, payment]) => ({ id, ...payment }));
                    setPayments(allPayments);
                } else {
                    setPayments([]);
                }
            });
        };
        fetchAllPayments();
    };

    const getUser = (email) => {
        const user = allUsers.find((user) => user.email === email);
        return user ? user : null;
    };

    return (
        <div className='max-w-6xl grid w-screen grid-cols-1 pr-8'>
            <h2 className="text-2xl text-white mb-6">All Payments</h2>
            <div className="flex mb-4">
                <div className="mr-4">
                    <label htmlFor="month" className="block text-white mb-2">
                        Month:
                    </label>
                    <select
                        id="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                    >
                        <option value="">All</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">Augest</option>
                        <option value="September">September</option>
                        <option value="October">Octobor</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                    </select>
                </div>
                <div className="mr-4">
                    <label htmlFor="year" className="block text-white mb-2">
                        Year:
                    </label>
                    <select
                        id="year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                    >
                        <option value="">All</option>
                        {Array.from({ length: 6 }).map((_, index) => {
                            const year = new Date().getFullYear() - index;
                            return <option key={year} value={year}>{year}</option>;
                        })}
                    </select>
                </div>
                <div>
                    <label htmlFor="user" className="block text-white mb-2">
                        User:
                    </label>
                    <input
                        type="text"
                        id="user"
                        value={selectedUser}
                        onChange={handleSearchUser}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
                        placeholder="Search user..."
                        list="user-suggestions"
                    />
                    <datalist id="user-suggestions">
                        {allUsers.map((user) => (
                            <option key={user.id} value={user.name} />
                        ))}
                    </datalist>
                </div>
            </div>
            <div className="mb-4">
                <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none"
                    onClick={handleFilter}
                >
                    Apply Filter
                </button>
                <button
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none ml-4"
                    onClick={handleResetFilter}
                >
                    Reset Filter
                </button>
            </div>
            {payments.length > 0 ? (
                <div className="overflow-x-auto">
                    <div className="max-w-full mx-auto">
                        <table className="block">
                            <thead>
                                <tr>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Name</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Position</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Department</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Month</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Year</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Method</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Number</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Trx ID</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="text-white py-2 px-4 border-b">
                                            {getUser(payment.email)?.name}
                                        </td>
                                        <td className="text-white py-2 px-4 border-b">
                                            {getUser(payment.email)?.position}
                                        </td>
                                        <td className="text-white py-2 px-4 border-b">
                                            {getUser(payment.email)?.department}
                                        </td>
                                        <td className="text-white py-2 px-4 border-b">{payment.month}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.year}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.paymentMethod}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.number}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.transactionId}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <p className="text-white">No payments found.</p>
            )}

        </div>
    );
};

const PaymentHistoryContent = () => {
    const [pendingPayments, setPendingPayments] = useState([]);


    useEffect(() => {
        const db = getDatabase(app);
        const paymentsRef = ref(db, 'payments');
        const auth = getAuth(app);

        const fetchPendingPayments = (snapshot) => {
            if (snapshot.exists()) {
                const paymentsData = snapshot.val();
                const pendingPayments = Object.entries(paymentsData)
                    .filter(([_, payment]) => payment.email === jsCookie.get("userEmail"))
                    .map(([id, payment]) => ({ id, ...payment }));
                setPendingPayments(pendingPayments);
            } else {
                setPendingPayments([]);
            }
        };

        const listener = onValue(paymentsRef, fetchPendingPayments);

        return () => {
            off(paymentsRef, 'value', listener);
        };
    }, []);

    const getStatusButton = (payment) => {
        if (payment.status === 'Pending') {
            return (
                <button className="bg-jukti-orange hover:bg-jukti-orange text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline mx-4">
                    Pending
                </button>
            );
        } else if (payment.status === 'Accepted') {
            return (
                <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline mx-4">
                    Accepted
                </button>
            );
        } else if (payment.status === 'Rejected') {
            return (
                <button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline mx-4"
                >
                    Rejected
                </button>
            );
        }

        return null;
    };


    return (
        <div className='max-w-6xl grid w-screen grid-cols-1 pr-8'>
            <h2 className="text-2xl text-white mb-6">Payment History</h2>
            {pendingPayments.length > 0 ? (
                <div className="overflow-x-auto">
                    <div className="max-w-full mx-auto">
                        <table className="block">
                            <thead>
                                <tr>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Method</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Month</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Year</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Number</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Trx ID</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Amount</th>
                                    <th className="text-gray-300 text-left py-2 px-4 border-b">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingPayments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="text-white py-2 px-4 border-b">{payment.paymentMethod}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.month}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.year}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.number}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.transactionId}</td>
                                        <td className="text-white py-2 px-4 border-b">{payment.amount}</td>
                                        <td className="text-white py-2 px-4 border-b text-center">{getStatusButton(payment)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <p className="text-white">No pending payments found.</p>
            )}
        </div>
    );
};

const ProfileContent = () => {
    const [user, setUser] = useState({
        name: '',
        email: '',
        contact: '',
        position: '',
        department: '',
        password: '',
    });

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const auth = getAuth(app);
    const db = getDatabase(app);

    useEffect(() => {
        const fetchUser = (email) => {
            const usersRef = ref(db, 'users');
            const userQuery = query(usersRef, orderByChild('email'), equalTo(email));

            onValue(userQuery, (snapshot) => {
                const users = snapshot.val();
                if (users) {
                    const userId = Object.keys(users)[0];
                    const currUser = { id: userId, ...users[userId] };
                    setUser(currUser);
                }
            });
        };

        fetchUser(jsCookie.get("userEmail"));
    }, [jsCookie.get("userEmail"), db]);

    const updateUser = (updatedUser) => {
        const userRef = ref(db, `users/${updatedUser.id}`);
        update(userRef, updatedUser)
            .catch((error) => {
                alert('Error updating user in the database:', error);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { name, value } = e.target;
        setUser((prevUser) => ({
            ...prevUser,
            [name]: value,
        }));
        // Perform update logic here
        alert('Updated user:', user);

        // Update the user object in the database
        updateUser(user);
    };

    const handleChange = (e) => {
        e.preventDefault();
        const { name, value } = e.target;
        setUser((prevUser) => ({
            ...prevUser,
            [name]: value,
        }));
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert("Passwords don't match.");
            return;
        }

        try {
            await updatePassword(auth.currentUser, newPassword);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            alert('Error updating password:', error.message);
        }
    };

    const handleNewPasswordChange = (e) => {
        setNewPassword(e.target.value);
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
    };

    return (
        <div className=''>
            <h2 className="text-2xl text-white">Profile</h2>
            <div className="max-w-6xl grid w-screen grid-cols-1 py-2 mb-2 gap-4 justify-start rounded-lg md:grid-cols-2">
                <form className='mr-8' onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-white">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={user.name}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                            readOnly
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-white">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={user.email}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                            readOnly // Make the email input read-only
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="contact" className="block text-white">
                            Contact
                        </label>
                        <input
                            type="contact"
                            id="contact"
                            name="contact"
                            value={user.contact}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="position" className="block text-white">
                            Position
                        </label>
                        <input
                            type="text"
                            id="position"
                            name="position"
                            value={user.position}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                            readOnly
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="department" className="block text-white">
                            Department
                        </label>
                        <input
                            type="text"
                            id="department"
                            name="department"
                            value={user.department}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                            readOnly
                        />
                    </div>
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
                        Update
                    </button>
                </form>
                <form className='mr-8' onSubmit={handleChangePassword}>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-white">
                            New Password
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            onChange={handleNewPasswordChange}
                            value={newPassword}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="confirmPassword" className="block text-white">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            onChange={handleConfirmPasswordChange}
                            value={confirmPassword}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        />
                    </div>
                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
};

const SettingsContent = () => {
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [newDepartment, setNewDepartment] = useState('');
    const [newPosition, setNewPosition] = useState('');
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    const [newPaymentMethodDescription, setNewPaymentMethodDescription] = useState('');

    useEffect(() => {
        const db = getDatabase(app);
        const departmentsRef = ref(db, 'departments');
        const positionsRef = ref(db, 'positions');
        const paymentMethodsRef = ref(db, 'paymentMethods');

        // Fetch departments from the database
        onValue(departmentsRef, (snapshot) => {
            const departmentsData = snapshot.val();
            const departmentsList = [];
            snapshot.forEach((childSnapshot) => {
                const department = {
                    id: childSnapshot.key,
                    name: childSnapshot.val(),
                };
                departmentsList.push(department);
            });
            setDepartments(departmentsList);
        });

        // Fetch positions from the database
        onValue(positionsRef, (snapshot) => {
            const positionsData = snapshot.val();
            const positionsList = [];
            snapshot.forEach((childSnapshot) => {
                const position = {
                    id: childSnapshot.key,
                    name: childSnapshot.val(),
                };
                positionsList.push(position);
            });
            setPositions(positionsList);
        });

        // Fetch payment methods from the database
        onValue(paymentMethodsRef, (snapshot) => {
            const paymentMethodsData = snapshot.val();
            const paymentMethodsList = [];
            snapshot.forEach((childSnapshot) => {
                const paymentMethod = {
                    id: childSnapshot.key,
                    name: childSnapshot.val().name,
                    description: childSnapshot.val().description.replace(/\n/g, '<br>'),
                };
                paymentMethodsList.push(paymentMethod);
            });
            setPaymentMethods(paymentMethodsList);
        });
    }, []);

    const handleAddDepartment = () => {
        if (newDepartment.trim() !== '') {
            const db = getDatabase(app);
            const departmentsRef = ref(db, 'departments');
            push(departmentsRef, newDepartment);
            setNewDepartment('');
        }
    };

    const handleAddPosition = () => {
        if (newPosition.trim() !== '') {
            const db = getDatabase(app);
            const positionsRef = ref(db, 'positions');
            push(positionsRef, newPosition);
            setNewPosition('');
        }
    };

    const handleAddPaymentMethod = () => {
        if (newPaymentMethod.trim() !== '' && newPaymentMethodDescription.trim() !== '') {
            const db = getDatabase(app);
            const paymentMethodsRef = ref(db, 'paymentMethods');
            push(paymentMethodsRef, {
                name: newPaymentMethod,
                description: newPaymentMethodDescription,
            });
            setNewPaymentMethod('');
            setNewPaymentMethodDescription('');
        }
    };

    const handleDeleteDepartment = (departmentId) => {
        const db = getDatabase(app);
        const departmentRef = ref(db, `departments/${departmentId}`);
        remove(departmentRef);
    };

    const handleDeletePosition = (positionId) => {
        const db = getDatabase(app);
        const positionRef = ref(db, `positions/${positionId}`);
        remove(positionRef);
    };

    const handleDeletePaymentMethod = (paymentMethodId) => {
        const db = getDatabase(app);
        const paymentMethodRef = ref(db, `paymentMethods/${paymentMethodId}`);
        remove(paymentMethodRef);
    };

    return (
        <div className='max-w-6xl grid w-screen grid-cols-1 pr-8'>
            <h2 className="text-2xl text-white">Settings</h2>
            <div className="flex flex-col mt-8">
                <h3 className="text-xl text-gray-300 mb-4">Departments</h3>
                <ul className="mb-4 items-center">
                    {departments.map((department) => (
                        <li key={department.id} className="flex items-center justify-between py-2">
                            <span className="text-white">{department.name}</span>
                            <button
                                className="text-red-500"
                                onClick={() => handleDeleteDepartment(department.id)}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="New Department"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 mr-2"
                    />
                    <button
                        className="bg-jukti-orange text-white px-4 py-2 rounded-md"
                        onClick={handleAddDepartment}
                    >
                        Add
                    </button>
                </div>
            </div>
            <div className="mt-8">
                <h3 className="text-xl text-gray-300 mb-4">Positions</h3>
                <ul className="mb-4">
                    {positions.map((position) => (
                        <li key={position.id} className="flex items-center justify-between py-2">
                            <span className="text-white">{position.name}</span>
                            <button
                                className="text-red-500"
                                onClick={() => handleDeletePosition(position.id)}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="New Position"
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 mr-2"
                    />
                    <button
                        className="bg-jukti-orange text-white px-4 py-2 rounded-md"
                        onClick={handleAddPosition}
                    >
                        Add
                    </button>
                </div>
            </div>
            <div className="mt-8">
                <h3 className="text-xl text-gray-300 mb-4">Payment Methods</h3>
                <ul className="mb-4">
                    {paymentMethods.map((paymentMethod) => (
                        <li key={paymentMethod.id} className="flex items-center justify-between py-2">
                            <div>
                                <span className="text-white font-bold text-xl">{paymentMethod.name}</span>
                                <div className="formatted-text text-white" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: paymentMethod.description }}></div>
                            </div>
                            <button
                                className="text-red-500"
                                onClick={() => handleDeletePaymentMethod(paymentMethod.id)}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
                <div className="flex items-center">
                    <input
                        type="text"
                        placeholder="New Payment Method"
                        value={newPaymentMethod}
                        onChange={(e) => setNewPaymentMethod(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 mr-2"
                    />
                    <button
                        className="bg-jukti-orange text-white px-4 py-2 rounded-md"
                        onClick={handleAddPaymentMethod}
                    >
                        Add
                    </button>
                </div>
                <textarea
                    placeholder="Description"
                    value={newPaymentMethodDescription}
                    onChange={(e) => setNewPaymentMethodDescription(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 mr-2 my-2 w-full h-auto"
                />

            </div>
        </div>
    );
};

const UsersContent = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const db = getDatabase(app);
        const usersRef = ref(db, 'users');

        const getUsers = () => {
            onValue(usersRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const userList = Object.entries(data).map(([uid, user]) => ({
                        uid,
                        name: user.name,
                        position: user.position,
                        department: user.department,
                        contact: user.contact,
                        isAdmin: user.isAdmin,
                    }));
                    setUsers(userList);
                }
            });
        };

        getUsers();

        return () => {
            // Unsubscribe from the database reference when component unmounts
            getUsers();
        };
    }, []);

    const handleAdminCheckboxChange = (uid, checked) => {
        // Update the isAdmin status of the user in the database
        const db = getDatabase(app);
        const userRef = ref(db, `users/${uid}/isAdmin`);

        set(userRef, checked);
    };

    // Group users by department
    const groupedUsers = {};
    users.forEach((user) => {
        const department = user.department;
        if (groupedUsers.hasOwnProperty(department)) {
            groupedUsers[department].push(user);
        } else {
            groupedUsers[department] = [user];
        }
    });

    return (
        <div>
            <h2 className="text-2xl text-white">Users</h2>
            {Object.entries(groupedUsers).map(([department, departmentUsers]) => (
                <div key={department} className="mt-6">
                    <h3 className="text-xl font-semibold text-white">{department}</h3>
                    <div className="flex flex-wrap justify-start">
                        {departmentUsers.map((user) => (
                            <div key={user.uid} className="flex flex-col sm:col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 mx-2 pt-4">
                                <div className="bg-gray-800 rounded-lg p-6 text-white">
                                    <h3 className="text-xl font-semibold mb-2">{user.name}</h3>
                                    <p className="text-md mb-1">
                                        <strong>Position:</strong> {user.position}
                                    </p>
                                    <p className="text-md mb-1">
                                        <strong>Department:</strong> {user.department}
                                    </p>
                                    <p className="text-md mb-1">
                                        <strong>Contact:</strong> {user.contact}
                                    </p>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={user.isAdmin}
                                            onChange={(e) => handleAdminCheckboxChange(user.uid, e.target.checked)}
                                        />
                                        <span className="text-md">Admin</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReportsContent = () => {
    return (
        <div>
            <h2 className="text-2xl text-white">Reports</h2>
        </div>
    );
};

const CalenderContent = ({ department, isAdmin }) => {
    const [eventName, setEventName] = useState('');
    const [eventDetails, setEventDetails] = useState('');
    const [eventStartDateTime, setEventStartDateTime] = useState('');
    const [eventEndDateTime, setEventEndDateTime] = useState('');
    const [eventType, setEventType] = useState('');
    const [events, setEvents] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [newEventType, setNewEventType] = useState('');
    const [newEventTypeColor, setNewEventTypeColor] = useState('#000000');

    const handleEventNameChange = (e) => {
        setEventName(e.target.value);
    };

    const handleEventDetailsChange = (e) => {
        setEventDetails(e.target.value);
    };

    const handleEventDateTimeChange = (fieldName, value) => {
        if (fieldName === 'start') {
            setEventStartDateTime(value);
        } else if (fieldName === 'end') {
            setEventEndDateTime(value);
        }
    };

    const handleEventTypeChange = (e) => {
        setEventType(e.target.value);
    };

    const handleCreateEvent = (e) => {
        e.preventDefault();

        if (!eventName || !eventStartDateTime || !eventEndDateTime || !eventType) {
            alert('Please enter event name, start time, end time, and type.');
            return;
        }

        const newEvent = {
            title: eventName,
            details: eventDetails,
            start: eventStartDateTime,
            end: eventEndDateTime,
            type: eventType,
        };

        const db = getDatabase(app);
        const eventsRef = ref(db, 'events');
        push(eventsRef, newEvent);

        setEventName('');
        setEventDetails('');
        setEventStartDateTime('');
        setEventEndDateTime('');
        setEventType('');
    };

    useEffect(() => {
        const db = getDatabase(app);
        const eventsRef = ref(db, 'events');

        onValue(eventsRef, (snapshot) => {
            if (snapshot.exists()) {
                const eventData = snapshot.val();
                const allEvents = Object.keys(eventData).map((eventId) => {
                    const event = eventData[eventId];
                    const startDateTime = moment(event.start).toDate();
                    const endDateTime = moment(event.end).toDate();
                    return {
                        id: eventId,
                        ...event,
                        start: startDateTime,
                        end: endDateTime,
                    };
                });
                setEvents(allEvents);
            } else {
                setEvents([]);
            }
        });

        const eventTypesRef = ref(db, 'eventTypes');

        onValue(eventTypesRef, (snapshot) => {
            if (snapshot.exists()) {
                const eventData = snapshot.val();
                const allEventTypes = Object.keys(eventData).map((eventTypeId) => {
                    const eventType = eventData[eventTypeId];
                    return {
                        id: eventTypeId,
                        ...eventType,
                    };
                });
                setEventTypes(allEventTypes);
            } else {
                setEventTypes([]);
            }
        });
    }, []);

    const handleCreateEventType = async (e) => {
        e.preventDefault();

        if (newEventType.trim() !== '' && newEventTypeColor.trim() !== '') {
            const db = getDatabase(app);
            const eventTypesRef = ref(db, 'eventTypes');

            const type = {
                name: newEventType,
                color: newEventTypeColor,
            };

            const newEventTypeKey = push(eventTypesRef);
            const newEventTypeChildRef = newEventTypeKey.key;

            try {
                await set(newEventTypeKey, type);
                setNewEventType('');
                setNewEventTypeColor('#000000');
            }
            catch (error) {
                console.log(error);
            }
        }
    };

    const handleDeleteEventType = (eventTypeId) => {
        const db = getDatabase(app);
        const eventTypeRef = ref(db, `eventTypes/${eventTypeId}`);
        remove(eventTypeRef);
    };

    const getEventColor = (event) => {
        const getEventType = eventTypes.find((eventType) => eventType.name === event.type);
        if (getEventType) {
            return {
                style: {
                    backgroundColor: getEventType.color,
                },
            }
        }
        return {};
    };

    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState({});

    const MyModal = () => {
        const [isEditing, setIsEditing] = useState(false);
        const [editedEventName, setEditedEventName] = useState('');
        const [editedEventDetails, setEditedEventDetails] = useState('');
        const [editedEventStartDateTime, setEditedEventStartDateTime] = useState('');
        const [editedEventEndDateTime, setEditedEventEndDateTime] = useState('');
        const [editedEventType, setEditedEventType] = useState('');

        const handleEditedEventNameChange = (e) => {
            setEditedEventName(e.target.value);
        };

        const handleEditedEventDetailsChange = (e) => {
            setEditedEventDetails(e.target.value);
        };

        const handleEditedEventDateTimeChange = (fieldName, value) => {
            if (fieldName === 'start') {
                setEditedEventStartDateTime(value);
            } else if (fieldName === 'end') {
                setEditedEventEndDateTime(value);
            }
        };

        const handleEditedEventTypeChange = (e) => {
            setEditedEventType(e.target.value);
        };

        const handleDeleteEvent = () => {
            const db = getDatabase(app);
            const eventRef = ref(db, `events/${selectedEvent.id}`);
            remove(eventRef);
            setShowModal(false);
        };

        const handleUpdateEvent = (e) => {
            e.preventDefault();

            if (!editedEventName || !editedEventStartDateTime || !editedEventEndDateTime || !editedEventType) {
                alert('Please enter event name, start time, end time, and type.');
                return;
            }

            const updatedEvent = {
                title: editedEventName,
                details: editedEventDetails,
                start: editedEventStartDateTime,
                end: editedEventEndDateTime,
                type: editedEventType,
            };

            const db = getDatabase(app);
            const eventRef = ref(db, `events/${selectedEvent.id}`);
            update(eventRef, updatedEvent);

            setEditedEventName('');
            setEditedEventDetails('');
            setEditedEventStartDateTime('');
            setEditedEventEndDateTime('');
            setEditedEventType('');
            setIsEditing(false);
            setShowModal(false);
        };

        const handleEditEvent = () => {
            setIsEditing(true);
            setEditedEventName(selectedEvent.title);
            setEditedEventDetails(selectedEvent.details);
            setEditedEventStartDateTime(selectedEvent.start);
            setEditedEventEndDateTime(selectedEvent.end);
            setEditedEventType(selectedEvent.type);
            setShowModal(true);
        };

        const handleCancelEdit = () => {
            setIsEditing(false);
            setEditedEventName('');
            setEditedEventDetails('');
            setEditedEventStartDateTime('');
            setEditedEventEndDateTime('');
            setEditedEventType('');
        };

        return (
            <div className="fixed inset-0 flex justify-center items-center" style={{zIndex:1000}}>
                <div className="flex items-end justify-center min-h-screen px-4 pb-30 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                        <div className="absolute inset-0 bg-gray-500 opacity-75" />
                    </div>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                        &#8203;
                    </span>
                    <div
                        className="inline-block align-center bg-white rounded-lg text-left overflow-auto shadow-xl transform transition-all sm:align-middle sm:max-w-6xl sm:w-full"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-headline"
                    >
                        <div className="bg-gray-900 p-6">
                            <div className="sm:flex sm:items-start">
                                <div className="text-left w-full">
                                    <div className="mt-2">
                                        <form onSubmit={isEditing ? handleUpdateEvent : handleCreateEvent} className="grid grid-cols-1">
                                            <div className="flex flex-col">
                                                <label className="block text-white mb-1" htmlFor="eventName">
                                                    Event Name:
                                                </label>
                                                <input
                                                    className="px-2 py-1 rounded bg-gray-300"
                                                    type="text"
                                                    id="eventName"
                                                    value={isEditing ? editedEventName : selectedEvent.title}
                                                    onChange={isEditing ? handleEditedEventNameChange : handleEventNameChange}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            <div className="flex flex-col py-2">
                                                <label className="block text-white mb-1" htmlFor="eventType">
                                                    Event Type:
                                                </label>
                                                <select
                                                    className="px-2 py-2 rounded bg-gray-100"
                                                    id="eventType"
                                                    value={isEditing ? editedEventType : selectedEvent.type}
                                                    onChange={isEditing ? handleEditedEventTypeChange : handleEventTypeChange}
                                                    disabled={!isEditing}
                                                >
                                                    <option value="">Select Event Type</option>
                                                    {eventTypes.map((eventType) => (
                                                        <option key={eventType.id} value={eventType.name}>
                                                            {eventType.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex flex-col py-2">
                                                <label className="block text-white mb-1" htmlFor="eventDetails">
                                                    Event Details:
                                                </label>
                                                <textarea
                                                    className="px-2 py-2 rounded bg-gray-300"
                                                    type="text"
                                                    id="eventDetails"
                                                    value={isEditing ? editedEventDetails : selectedEvent.details}
                                                    onChange={isEditing ? handleEditedEventDetailsChange : handleEventDetailsChange}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            <div className="flex flex-col py-2">
                                                <label className="block text-white mb-1" htmlFor="eventStartDateTime">
                                                    Start DateTime:
                                                </label>
                                                <input
                                                    className="px-2 py-1 rounded bg-gray-300"
                                                    type='datetime-local'
                                                    id="eventStartDateTime"
                                                    value={isEditing ? moment(editedEventStartDateTime).format('YYYY-MM-DDTHH:mm') : moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm')}
                                                    onChange={(e) => handleEditedEventDateTimeChange('start', e.target.value)}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            <div className="flex flex-col py-2">
                                                <label className="block text-white mb-1" htmlFor="eventEndDateTime">
                                                    End DateTime:
                                                </label>
                                                <input
                                                    className="px-2 py-1 rounded bg-gray-300"
                                                    type="datetime-local"
                                                    id="eventEndDateTime"
                                                    value={isEditing ? moment(editedEventEndDateTime).format('YYYY-MM-DDTHH:mm') : moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm')}
                                                    onChange={(e) => handleEditedEventDateTimeChange('end', e.target.value)}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            {(department === 'Public Relations' || isAdmin) && (
                                            <div className="flex flex-wrap justify-between items-center">
                                                {isEditing ? (
                                                    <>
                                                        <div className="flex flex-col mt-4 mr-2">
                                                            <button
                                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-4 py-1 rounded focus:outline-none "
                                                                type="submit"
                                                            >
                                                                Update
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col mt-4 mr-2">
                                                            <button
                                                                className="bg-red-500 hover:bg-red-700 text-white font-bold px-4 py-1 rounded focus:outline-none "
                                                                type="button"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col mt-4">
                                                        <button
                                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-4 py-1 rounded focus:outline-none"
                                                            type="button"
                                                            onClick={handleEditEvent}
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="flex flex-col mt-4">
                                                    <button
                                                        className="bg-red-500 hover:bg-red-700 text-white font-bold px-4 py-1 rounded focus:outline-none "
                                                        type="button"
                                                        onClick={handleDeleteEvent}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            )}
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-900 px-4 py-4 flex flex-row-reverse">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-jukti-orange text-base font-medium text-white hover:bg-jukti-orange-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jukti-orange-dark"
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };




    return (
        <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
            <h2 className="text-2xl text-white">Event Calendar</h2>
            <div className="my-4">
                <div style={{ height: 500 }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        onSelectEvent={(event) => {
                            setSelectedEvent(event);
                            setShowModal(true);
                        }}
                        startAccessor="start"
                        endAccessor="end"
                        defaultView={Views.MONTH}
                        views={[Views.MONTH, Views.WEEK, Views.DAY]}
                        className="react-big-calendar rounded-lg p-6 w-full bg-white"
                        eventPropGetter={getEventColor}
                    />
                </div>
                {showModal && <MyModal />}
                {(department === 'Public Relations' || isAdmin) && (
                    <div className="my-4">
                        <h3 className="text-lg text-white">Create Event</h3>
                        <form onSubmit={handleCreateEvent} className="grid sm:grid-cols-1 lg:grid-cols-6 py-2">
                            <div className="flex flex-col">
                                <label className="block text-white mb-1" htmlFor="eventName">
                                    Event Name:
                                </label>
                                <input
                                    className="px-2 py-1 rounded"
                                    type="text"
                                    id="eventName"
                                    value={eventName}
                                    onChange={handleEventNameChange}
                                />
                            </div>
                            <div className="flex flex-col lg:ml-2">
                                <label className="block text-white mb-1" htmlFor="eventType">
                                    Event Type:
                                </label>
                                <select
                                    className="px-2 py-2 rounded"
                                    id="eventType"
                                    value={eventType}
                                    onChange={handleEventTypeChange}
                                >
                                    <option value="">Select Event Type</option>
                                    {eventTypes.map((eventType) => (
                                        <option key={eventType.id} value={eventType.name}>
                                            {eventType.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col lg:ml-2">
                                <label className="block text-white mb-1" htmlFor="eventDetails">
                                    Event Details:
                                </label>
                                <textarea
                                    className="px-2 rounded"
                                    type="text"
                                    id="eventDetails"
                                    value={eventDetails}
                                    onChange={handleEventDetailsChange}
                                />
                            </div>
                            <div className="flex flex-col lg:ml-2">
                                <label className="block text-white mb-1" htmlFor="eventStartDateTime">
                                    Start DateTime:
                                </label>
                                <input
                                    className="px-2 py-1 rounded"
                                    type='datetime-local'
                                    id="eventStartDateTime"
                                    value={eventStartDateTime}
                                    onChange={(e) => handleEventDateTimeChange('start', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col lg:ml-2">
                                <label className="block text-white mb-1" htmlFor="eventEndDateTime">
                                    End DateTime:
                                </label>
                                <input
                                    className="px-2 py-1 rounded"
                                    type="datetime-local"
                                    id="eventEndDateTime"
                                    value={eventEndDateTime}
                                    onChange={(e) => handleEventDateTimeChange('end', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col mt-7 lg:ml-2">
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-8 py-1 rounded focus:outline-none"
                                    type="submit"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                <div className="my-4" />
                <h3 className="text-lg text-white">Event Types</h3>
                {(department === 'Public Relations' || isAdmin) && (
                    <form onSubmit={handleCreateEventType} className="grid sm:grid-cols-1 lg:grid-cols-6 py-2">
                        <div className="flex flex-col">
                            <label className="block text-white mb-1" htmlFor="newEventType">
                                Event Type:
                            </label>
                            <input
                                className="px-2 py-1 rounded"
                                type="text"
                                id="newEventType"
                                value={newEventType}
                                onChange={(e) => setNewEventType(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col lg:ml-2">
                            <label className="block text-white mb-1" htmlFor="newEventTypeColor">
                                Color:
                            </label>
                            <input
                                className="px-2 py-1 rounded"
                                type="color"
                                id="newEventTypeColor"
                                value={newEventTypeColor}
                                onChange={(e) => setNewEventTypeColor(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col mt-7 lg:ml-2">
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold px-8 py-1 rounded focus:outline-none"
                                type="submit"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    {eventTypes.map((eventType) => (
                        <div
                            key={eventType.id}
                            className="flex flex-col bg-white rounded-lg p-2"
                        >
                            <div className="flex justify-between">
                                <div className="text-lg font-bold">{eventType.name}</div>
                                <div
                                    className="rounded-full h-6 w-6"
                                    style={{ backgroundColor: eventType.color }}
                                />
                            </div>
                            {(department === 'Public Relations' || isAdmin) && (
                                <div className="flex justify-end">
                                    <button
                                        className="bg-red-500 hover:bg-red-700 text-white font-bold px-2 py-1 rounded focus:outline-none"
                                        onClick={() => handleDeleteEventType(eventType.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
