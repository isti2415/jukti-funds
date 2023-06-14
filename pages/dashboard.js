import { useState, useEffect, useRef, use } from "react";
import React from "react";
import { useRouter } from "next/router";
import Layout from "../components/layout";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updatePassword,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  orderByChild,
  equalTo,
  push,
  remove,
  get,
  query,
  off,
} from "firebase/database";
import app from "./api/firebaseConfig";
import { Disclosure, Transition } from "@headlessui/react";
import jsCookie from "js-cookie";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faMailBulk } from "@fortawesome/free-solid-svg-icons";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/solid";
import {
  getStorage,
  ref as storagesRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import Link from "next/link";

const localizer = momentLocalizer(moment);

const db = getDatabase(app);

const auth = getAuth(app);

const getMonthOptions = () => {
  return [
    <option value="">Select Month</option>,
    <option value="January">January</option>,
    <option value="February">February</option>,
    <option value="March">March</option>,
    <option value="April">April</option>,
    <option value="May">May</option>,
    <option value="June">June</option>,
    <option value="July">July</option>,
    <option value="August">August</option>,
    <option value="September">September</option>,
    <option value="October">October</option>,
    <option value="November">November</option>,
    <option value="December">December</option>,
  ];
};

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  years.push(<option value="">Select Year</option>);
  for (let i = 2023; i <= currentYear + 5; i++) {
    years.push(<option value={i}>{i}</option>);
  }
  return years;
};

const Dashboard = () => {
  const router = useRouter();

  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("calender");
  const [isAdmin, setIsAdmin] = useState(false); // Default value set to false
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [name, setName] = useState("");

  const toggleMenu = () => {
    setIsMenuExpanded((prevIsMenuExpanded) => !prevIsMenuExpanded);
  };

  const handleMenuSelection = (menu) => {
    setSelectedMenu(menu);
    setIsMenuExpanded(false);
  };

  useEffect(() => {
    const fetchUserIsAdmin = (email) => {
      const usersRef = ref(db, "users");

      onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        if (users) {
          const isAdmin =
            Object.values(users).find((user) => user.email === email)
              ?.isAdmin || false;
          setIsAdmin(isAdmin);
          setDepartment(
            Object.values(users).find((user) => user.email === email)
              ?.department
          );
          setPosition(
            Object.values(users).find((user) => user.email === email)?.position
          );
          setName(
            Object.values(users).find((user) => user.email === email)?.name
          );
        }
      });
    };

    try {
      // Assuming you have stored isAdmin field in the user document
      // Retrieve the authenticated user's data
      const email = jsCookie.get("userEmail");

      // Fetch isAdmin value from the database based on the user's email
      fetchUserIsAdmin(email);
    } catch (error) {
      // Handle any errors that occur during fetching user data
      alert("Error fetching user data:", error);
    }

    // Listen to changes in authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const email = user.email;

        // Fetch the isAdmin status from the Realtime Database
        fetchUserIsAdmin(email);
      } else {
        //Remove the user cookie
        jsCookie.remove("userEmail");
        // Handle the case when the user is not authenticated
        router.push("/login");
      }
    });

    if (selectedMenu === "logout") {
      // Handle logout action
      signOut(auth)
        .then(() => {
          // Remove the user cookie
          jsCookie.remove("userEmail");
          router.push("/login"); // Redirect to the login page
        })
        .catch((error) => {
          alert("Error logging out:", error);
        });
    }

    return () => {
      unsubscribe(); // Unsubscribe the listener on component unmount
    };
  }, [selectedMenu, router, auth]);

  if (jsCookie.get("userEmail")) {
    return (
      <Layout>
        <div
          className={`floating-menu-icon ${isMenuExpanded ? "open" : ""}`}
          onClick={toggleMenu}
        >
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
            className={`bg-gray-800 fixed top-10 min-h-screen right-0 ${
              isMenuExpanded ? "w-64" : "w-0"
            } transition-width duration-300 overflow-y-auto transition-all ease-in-out`}
            style={{ zIndex: 999 }}
          >
            {/* Menu content */}
            {isMenuExpanded && (
              <ul className="mt-8">
                <li
                  className={`py-2 pl-4 cursor-pointer ${
                    selectedMenu === "Payment"
                      ? "bg-jukti-orange"
                      : "hover:bg-gray-800"
                  }`}
                  onClick={() => handleMenuSelection("Payment")}
                >
                  <span className="text-white">Record Deposit</span>
                </li>
                {isAdmin ? (
                  <li
                    className={`py-2 pl-4 cursor-pointer ${
                      selectedMenu === "receivedFunds"
                        ? "bg-jukti-orange"
                        : "hover:bg-gray-800"
                    }`}
                    onClick={() => handleMenuSelection("receivedFunds")}
                  >
                    <span className="text-white">Received Funds</span>
                  </li>
                ) : null}
                <li
                  className={`py-2 pl-4 cursor-pointer ${
                    selectedMenu === "RecordExpense"
                      ? "bg-jukti-orange"
                      : "hover:bg-gray-800"
                  }`}
                  onClick={() => handleMenuSelection("RecordExpense")}
                >
                  <span className="text-white">Record Expense</span>
                </li>
                <li
                  className={`py-2 pl-4 cursor-pointer ${
                    selectedMenu === "PaymentHistory"
                      ? "bg-jukti-orange"
                      : "hover:bg-gray-800"
                  }`}
                  onClick={() => handleMenuSelection("PaymentHistory")}
                >
                  <span className="text-white">Payment History</span>
                </li>
                {isAdmin ? (
                  <li
                    className={`py-2 pl-4 cursor-pointer ${
                      selectedMenu === "allpayment"
                        ? "bg-jukti-orange"
                        : "hover:bg-gray-800"
                    }`}
                    onClick={() => handleMenuSelection("allpayment")}
                  >
                    <span className="text-white">All Deposits</span>
                  </li>
                ) : null}
                {isAdmin ? (
                  <li
                    className={`py-2 pl-4 cursor-pointer ${
                      selectedMenu === "allexpense"
                        ? "bg-jukti-orange"
                        : "hover:bg-gray-800"
                    }`}
                    onClick={() => handleMenuSelection("allexpense")}
                  >
                    <span className="text-white">All Expenses</span>
                  </li>
                ) : null}
                {isAdmin ? (
                  <li
                    className={`py-2 pl-4 cursor-pointer ${
                      selectedMenu === "pendingpayment"
                        ? "bg-jukti-orange"
                        : "hover:bg-gray-800"
                    }`}
                    onClick={() => handleMenuSelection("pendingpayment")}
                  >
                    <span className="text-white">Pending Requests</span>
                  </li>
                ) : null}
                {isAdmin ? (
                  <li
                    className={`py-2 pl-4 cursor-pointer ${
                      selectedMenu === "reports"
                        ? "bg-jukti-orange"
                        : "hover:bg-gray-800"
                    }`}
                    onClick={() => handleMenuSelection("reports")}
                  >
                    <span className="text-white">Reports</span>
                  </li>
                ) : null}
                <li
                  className={`py-2 pl-4 cursor-pointer ${
                    selectedMenu === "calender"
                      ? "bg-jukti-orange"
                      : "hover:bg-gray-800"
                  }`}
                  onClick={() => handleMenuSelection("calender")}
                >
                  <span className="text-white">Event Calender</span>
                </li>
                <li
                  className={`py-2 pl-4 cursor-pointer ${
                    selectedMenu === "users"
                      ? "bg-jukti-orange"
                      : "hover:bg-gray-800"
                  }`}
                  onClick={() => handleMenuSelection("users")}
                >
                  <span className="text-white">Board Members</span>
                </li>
                <li
                  className={`py-2 pl-4 cursor-pointer ${
                    selectedMenu === "profile"
                      ? "bg-jukti-orange"
                      : "hover:bg-gray-800"
                  }`}
                  onClick={() => handleMenuSelection("profile")}
                >
                  <span className="text-white">Profile</span>
                </li>
                {isAdmin ? (
                  <li
                    className={`py-2 pl-4 cursor-pointer ${
                      selectedMenu === "settings"
                        ? "bg-jukti-orange"
                        : "hover:bg-gray-800"
                    }`}
                    onClick={() => handleMenuSelection("settings")}
                  >
                    <span className="text-white">Settings</span>
                  </li>
                ) : null}
                <li
                  className={`py-2 pl-4 cursor-pointer ${
                    selectedMenu === "logout"
                      ? "bg-jukti-orange"
                      : "hover:bg-gray-800"
                  }`}
                  onClick={() => handleMenuSelection("logout")}
                >
                  <span className="text-white">Logout</span>
                </li>
              </ul>
            )}
          </div>
          <div className=" bg-gray-900 min-h-full mb-4">
            {selectedMenu === "Payment" && <PaymentContent />}
            {selectedMenu === "receivedFunds" && <ReceivedFundsContent />}
            {selectedMenu === "RecordExpense" && <RecordExpenseContent />}
            {selectedMenu === "PaymentHistory" && <PaymentHistoryContent />}
            {selectedMenu === "profile" && <ProfileContent />}
            {selectedMenu === "allpayment" && <AllPaymentContent />}
            {selectedMenu === "reports" && (
              <ReportsContent
                currentUserName={name}
                currentUserPosition={position}
              />
            )}
            {selectedMenu === "calender" && (
              <CalenderContent department={department} isAdmin={isAdmin} />
            )}
            {selectedMenu === "settings" && <SettingsContent />}
            {selectedMenu === "users" && <UsersContent isAdmin={isAdmin} />}
            {selectedMenu === "pendingpayment" && <PendingPaymentContent />}
            {selectedMenu === "allexpense" && <AllExpenseContent />}
          </div>
        </div>
      </Layout>
    );
  }
};

const PaymentContent = () => {
  const [duplicate, setDuplicate] = useState(false);
  const [trxDuplicate, setTrxDuplicate] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [paymentData, setPaymentData] = useState({
    month: "",
    year: "",
    paymentMethod: "",
    number: "",
    transactionId: "",
    amount: "",
    status: "Pending",
    emailMonthYearStatus: "",
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
      alert("Payment for this month already done.");
    } else if (trxDuplicate) {
      alert("Transaction ID already exists.");
    } else {
      // Save paymentData to the database
      savePaymentData(paymentData);
      // Reset the form
      setPaymentData({
        month: "",
        year: "",
        paymentMethod: "",
        number: "",
        transactionId: "",
        amount: "",
        status: "Pending",
        emailMonthYearStatus: "",
      });
    }
  };

  useEffect(() => {
    const checkExistingRecord = (month, year, status) => {
      const paymentsRef = ref(db, "payments");
      const compositeKey = `${jsCookie.get(
        "userEmail"
      )}_${month}_${year}_${status}`;
      const paymentQuery = query(
        paymentsRef,
        orderByChild("emailMonthYearStatus"),
        equalTo(compositeKey)
      );

      onValue(paymentQuery, (snapshot) => {
        const payments = snapshot.val();
        if (payments) {
          setDuplicate(true);
        } else {
          setDuplicate(false);
        }
      });
    };
    const checkExisting = (transactionId) => {
      const paymentsRef = ref(db, "payments");
      const trxQuery = query(
        paymentsRef,
        orderByChild("transactionId"),
        equalTo(transactionId)
      );
      onValue(trxQuery, (snapshot) => {
        const trxpayments = snapshot.val();
        if (trxpayments) {
          setTrxDuplicate(true);
        } else {
          setTrxDuplicate(false);
        }
      });
    };
    checkExistingRecord(
      paymentData.month,
      paymentData.year,
      paymentData.status
    );
    checkExisting(paymentData.transactionId);

    const paymentMethodsRef = ref(db, "paymentMethods");
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
  }, [
    jsCookie.get("userEmail"),
    db,
    paymentData.month,
    paymentData.status,
    paymentData.year,
  ]);

  const savePaymentData = (paymentData) => {
    paymentData.emailMonthYearStatus = `${jsCookie.get("userEmail")}_${
      paymentData.month
    }_${paymentData.year}_${paymentData.status}`;
    const paymentsRef = ref(db, "payments");
    push(paymentsRef, {
      ...paymentData,
      email: jsCookie.get("userEmail"),
    });
  };

  const [showModal, setShowModal] = useState(false);

  const MyModal = () => {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75"
        style={{ zIndex: 1000 }}
      >
        <div className="max-w-6xl max-h-screen grid w-screen grid-cols-1 bg-gray-900 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl text-white px-4 py-2 rounded-t-lg">
              Payment Methods
            </h2>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block ml-4"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
          <div className="max-h-[calc(100vh-128px)] overflow-y-auto">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((paymentMethod) => (
                <div key={paymentMethod.id} className="">
                  <Disclosure className="">
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="flex justify-between w-full px-4 py-2 my-4 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                          <h3 className="text-xl">{paymentMethod.name}</h3>
                        </Disclosure.Button>
                        <Transition
                          enter="transition duration-200 ease-out"
                          enterFrom="opacity-0"
                          enterTo="opacity-100"
                          leave="transition duration-150 ease-out"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Disclosure.Panel className="px-4 pt-4 pb-2 text-white text-lg bg-gray-800 rounded-lg">
                            <div
                              className="formatted-text"
                              style={{ whiteSpace: "pre-wrap" }}
                              dangerouslySetInnerHTML={{
                                __html: paymentMethod.description,
                              }}
                            ></div>
                          </Disclosure.Panel>
                        </Transition>
                      </>
                    )}
                  </Disclosure>
                </div>
              ))
            ) : (
              <p className="text-white">No payment methods found.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-white">Record Deposit</h2>
        <button
          class="bg-jukti-orange hover:bg-jukti-orange-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block ml-4"
          onClick={() => setShowModal(true)}
        >
          Payment Methods
        </button>
        {showModal && <MyModal />}
      </div>
      <form
        className="gap-4 py-16 justify-start rounded-lg"
        onSubmit={handleFormSubmit}
      >
        <div className="grid grid-cols-2 justify-between gap-4">
          <div className="mb-4">
            <label
              htmlFor="month"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
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
              {getMonthOptions()}
            </select>
          </div>
          <div className="mb-4">
            <label
              htmlFor="year"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
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
              {getYearOptions()}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="paymentMethod"
          >
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
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="number"
          >
            Number
          </label>
          <input
            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="number"
            id="number"
            placeholder="Account Number / Mobile Number"
            value={paymentData.number}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="transactionId"
          >
            Transaction ID
          </label>
          <input
            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="transactionId"
            id="transactionId"
            placeholder="Last 5 Digits of Transaction ID"
            value={paymentData.transactionId}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="amount"
          >
            Amount
          </label>
          <input
            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="amount"
            id="amount"
            placeholder="Amount Paid"
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

const PendingPaymentContent = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [expenseTrxId, setExpenseTrxId] = useState("");

  const paymentsRef = ref(db, "payments");
  const expensesRef = ref(db, "expenses");
  const usersRef = ref(db, "users");

  useEffect(() => {
    const paymentListener = onValue(paymentsRef, fetchPendingPayments);

    return () => {
      off(paymentsRef, "value", paymentListener);
    };
  }, []);

  useEffect(() => {
    const expenseListener = onValue(expensesRef, fetchPendingExpenses);

    return () => {
      off(expensesRef, "value", expenseListener);
    };
  }, []);

  useEffect(() => {
    const usersListener = onValue(usersRef, fetchAllUsers);

    return () => {
      off(usersRef, "value", usersListener);
    };
  }, []);

  const fetchPendingPayments = (snapshot) => {
    if (snapshot.exists()) {
      const paymentsData = snapshot.val();
      const pendingPayments = Object.entries(paymentsData)
        .filter(([_, payment]) => payment.status === "Pending")
        .map(([id, payment]) => ({ id, ...payment }));
      setPendingPayments(pendingPayments);
    } else {
      setPendingPayments([]);
    }
  };

  const fetchPendingExpenses = (snapshot) => {
    if (snapshot.exists()) {
      const expensesData = snapshot.val();
      const pendingExpenses = Object.entries(expensesData)
        .filter(([_, expense]) => expense.status === "Pending")
        .map(([id, expense]) => ({ id, ...expense }));
      setPendingExpenses(pendingExpenses);
    } else {
      setPendingExpenses([]);
    }
  };

  const fetchAllUsers = (snapshot) => {
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const allUsers = Object.entries(usersData).map(([id, user]) => ({
        id,
        ...user,
      }));
      setAllUsers(allUsers);
    } else {
      setAllUsers([]);
    }
  };

  const handleDepositAccept = (paymentId) => {
    const paymentRef = ref(db, `payments/${paymentId}`);
    update(paymentRef, { status: "Accepted" })
      .then(() => {
        const updatedPayments = pendingPayments.map((payment) => {
          if (payment.id === paymentId) {
            return {
              ...payment,
              status: "Accepted",
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
        console.log("Error accepting payment:", error);
      });
  };

  const handleDepositReject = (paymentId) => {
    const paymentRef = ref(db, `payments/${paymentId}`);
    update(paymentRef, { status: "Rejected" })
      .then(() => {
        const updatedPayments = pendingPayments.map((payment) => {
          if (payment.id === paymentId) {
            return {
              ...payment,
              status: "Rejected",
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
        console.log("Error rejecting payment:", error);
      });
  };

  const handleExpenseAccept = (expenseId) => {
    const expenseRef = ref(db, `expenses/${expenseId}`);
    update(expenseRef, { status: "Accepted", transactionId: expenseTrxId })
      .then(() => {
        const updatedExpenses = pendingExpenses.map((expense) => {
          if (expense.id === expenseId) {
            return {
              ...expense,
              status: "Accepted",
              transactionId: expenseTrxId,
            };
          }
          return expense;
        });
        const expenses = updatedExpenses.filter(
          (expense) => expense.id !== expenseId
        );
        setPendingExpenses(expenses);
      })
      .catch((error) => {
        console.log("Error accepting expense:", error);
      });
  };

  const handleExpenseReject = (expenseId) => {
    const expenseRef = ref(db, `expenses/${expenseId}`);
    update(expenseRef, { status: "Rejected" })
      .then(() => {
        const updatedExpenses = pendingExpenses.map((expense) => {
          if (expense.id === expenseId) {
            return {
              ...expense,
              status: "Rejected",
            };
          }
          return expense;
        });
        const expenses = updatedExpenses.filter(
          (expense) => expense.id !== expenseId
        );
        setPendingExpenses(expenses);
      })
      .catch((error) => {
        console.log("Error rejecting expense:", error);
      });
  };

  const getUser = (email) => {
    const user = allUsers.find((user) => user.email === email);
    return user ? user : null;
  };

  const [expenseAcceptModal, setExpenseAcceptModal] = useState(false);

  const ExpenseAcceptModal = ({ expenseId, onClose }) => {
    const inputRef = useRef(null);

    const handleSubmit = (e) => {
      e.preventDefault();
      handleExpenseAccept(expenseId);
      setExpenseTrxId("");
    };

    useEffect(() => {
      inputRef.current.focus();
    }, []);

    const handleInputChange = (e) => {
      setExpenseTrxId(e.target.value);
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="max-w-3xl w-full bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl text-white">Accept Expense</h2>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={onClose}
            >
              Close
            </button>
          </div>
          <form
            className="flex flex-col items-center justify-center"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col items-center justify-center">
              <label className="text-white">Transaction ID</label>
              <input
                ref={inputRef}
                className="w-64 px-2 py-1 mb-4 text-black rounded-lg"
                type="text"
                value={expenseTrxId}
                onChange={handleInputChange}
              />
            </div>
            <button
              className="px-4 py-2 mt-4 text-white bg-green-500 rounded-lg"
              type="submit"
            >
              Accept
            </button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8 gap-8">
      <h2 className="text-2xl text-white">Pending Requests</h2>
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
              <span className="text-lg">Pending Deposits</span>
              <ChevronDownIcon
                className={`${
                  open ? "transform rotate-180" : ""
                } w-5 h-5 text-white`}
              />
            </Disclosure.Button>
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel className="px-4 pb-2 text-sm text-gray-500">
                {pendingPayments.length > 0 ? (
                  <div className="overflow-x-auto bg-gray-800 p-2 rounded-xl">
                    <div className="w-full">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-gray-300 text-center py-2 px-2 border-b">
                              User
                            </th>
                            <th className="text-gray-300 text-center py-2 px-2 border-b">
                              Payment Method
                            </th>
                            <th className="text-gray-300 text-center py-2 px-2 border-b">
                              Number
                            </th>
                            <th className="text-gray-300 text-center py-2 px-2 border-b">
                              Transaction ID
                            </th>
                            <th className="text-gray-300 text-center py-2 px-2 border-b">
                              Month
                            </th>
                            <th className="text-gray-300 text-center py-2 px-2 border-b">
                              Year
                            </th>
                            <th className="text-gray-300 text-center py-2 px-2 border-b">
                              Amount
                            </th>
                            <th className="text-gray-300 text-center py-2 px-2 border-b">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingPayments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="text-white py-2 px-2 border-b">
                                {payment.email}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {payment.paymentMethod}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {payment.number}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {payment.transactionId}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {payment.month}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {payment.year}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {payment.amount} BDT
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                <button
                                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline mr-2 mb-2"
                                  onClick={() =>
                                    handleDepositAccept(payment.id)
                                  }
                                >
                                  Accept
                                </button>
                                <button
                                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                                  onClick={() =>
                                    handleDepositReject(payment.id)
                                  }
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
                  <p className="text-white">No Pending Requests found.</p>
                )}
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
              <span className="text-lg">Pending Expenses</span>
              <ChevronDownIcon
                className={`${
                  open ? "transform rotate-180" : ""
                } w-5 h-5 text-white`}
              />
            </Disclosure.Button>
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel className="px-4 pb-2 text-sm text-gray-500">
                {pendingExpenses.length > 0 ? (
                  <div className="overflow-x-auto bg-gray-800 p-2 rounded-xl">
                    <div className="w-full">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Name
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Position
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Department
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Date
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Amount
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Title
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Details
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Method
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Payment Details
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              File
                            </th>
                            <th className="text-gray-300 text-left py-2 px-2 border-b">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingExpenses.map((expense) => (
                            <tr key={expense.id}>
                              <td className="text-white py-2 px-2 border-b">
                                {getUser(expense.email)?.name}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {getUser(expense.email)?.position}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {getUser(expense.email)?.department}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {expense.date}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {expense.amount}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {expense.title}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {expense.details}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {expense.paymentMethod}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                {expense.paymentMethodDetails}
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                <Link
                                  href={expense.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-400"
                                >
                                  View
                                </Link>
                              </td>
                              <td className="text-white py-2 px-2 border-b">
                                <button
                                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                                  onClick={() => setExpenseAcceptModal(true)}
                                >
                                  Accept
                                </button>
                                {expenseAcceptModal && (
                                  <ExpenseAcceptModal
                                    expenseId={expense.id}
                                    onClose={() => setExpenseAcceptModal(false)}
                                  />
                                )}
                                <button
                                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
                                  onClick={() =>
                                    handleExpenseReject(expense.id)
                                  }
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
                  <p className="text-white">No Pending Expenses found.</p>
                )}
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    </div>
  );
};

const AllPaymentContent = () => {
  const [payments, setPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const fetchData = () => {
    const paymentsRef = ref(db, "payments");
    const departmentsRef = ref(db, "departments");
    const usersRef = ref(db, "users");

    Promise.all([get(paymentsRef), get(departmentsRef), get(usersRef)])
      .then((results) => {
        const [paymentsSnapshot, departmentsSnapshot, usersSnapshot] = results;

        if (paymentsSnapshot.exists()) {
          const paymentsData = paymentsSnapshot.val();
          const allPayments = Object.entries(paymentsData)
            .filter(([_, payment]) => payment.status === "Accepted")
            .map(([id, payment]) => ({ id, ...payment }));
          setPayments(allPayments.reverse());
          setFilteredPayments(allPayments.reverse()); // Set filtered payments initially
        } else {
          setPayments([]);
          setFilteredPayments([]);
        }

        if (departmentsSnapshot.exists()) {
          const departmentsData = departmentsSnapshot.val();
          const allDepartments = Object.entries(departmentsData).map(
            ([id, department]) => ({
              id,
              ...department,
            })
          );
          setDepartments(allDepartments);
        } else {
          setDepartments([]);
        }

        if (usersSnapshot.exists()) {
          const usersData = usersSnapshot.val();
          const allUsers = Object.entries(usersData).map(([id, user]) => ({
            id,
            ...user,
          }));
          setAllUsers(allUsers);
        } else {
          setAllUsers([]);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Create a copy of All Deposits for filtering
    let filteredPayments = [...payments];

    if (selectedMonth !== "") {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.month === selectedMonth
      );
    }

    if (selectedYear !== "") {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.year === selectedYear
      );
    }

    if (selectedUser !== "") {
      const filterName = selectedUser.toLowerCase();
      const filteredUsers = allUsers.filter((user) =>
        user.name.toLowerCase().includes(filterName)
      );

      if (filteredUsers.length > 0) {
        const filteredEmails = filteredUsers.map((user) => user.email);
        filteredPayments = filteredPayments.filter((payment) =>
          filteredEmails.includes(payment.email)
        );
      } else {
        // No users match, reset the payments
        filteredPayments = [];
      }
    }

    if (selectedDepartment !== "") {
      filteredPayments = filteredPayments.filter((payment) => {
        const user = allUsers.find((user) => user.email === payment.email);
        return user && user.department === selectedDepartment;
      });
    }

    setFilteredPayments(filteredPayments);
  }, [
    selectedMonth,
    selectedYear,
    selectedUser,
    selectedDepartment,
    payments,
    allUsers,
  ]);

  const handleResetFilter = () => {
    setSelectedMonth("");
    setSelectedYear("");
    setSelectedUser("");
    setSelectedDepartment("");
    setFilteredPayments(payments);
  };

  const getUser = (email) => {
    const user = allUsers.find((user) => user.email === email);
    return user ? user : null;
  };

  const [currentPage, setCurrentPage] = useState(0);
  const perPage = 20; // Number of items per page
  const offset = currentPage * perPage;
  const paginatedPayments = filteredPayments.slice(offset, offset + perPage);
  const pageCount = Math.ceil(filteredPayments.length / perPage);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "Name",
      "Position",
      "Department",
      "Month",
      "Year",
      "Method",
      "Number",
      "Trx ID",
      "Amount",
    ];

    const generateTableRows = (payments) => {
      const tableRows = [];
      filteredPayments.forEach((payment) => {
        const user = getUser(payment.email);
        const paymentData = [
          user ? user.name : "",
          user ? user.position : "",
          user ? user.department : "",
          payment.month,
          payment.year,
          payment.paymentMethod,
          payment.number,
          payment.transactionId,
          payment.amount,
        ];
        tableRows.push(paymentData);
      });
      return tableRows;
    };

    const generatePDFPages = () => {
      const totalPages = Math.ceil(payments.length / perPage);

      for (let i = 0; i < totalPages; i++) {
        const start = i * perPage;
        const end = start + perPage;
        const pagePayments = filteredPayments.slice(start, end);

        // Add page content
        doc.addImage("jukti.png", "PNG", 10, 8, 33, 19); // Add JUKTI logo on the left
        doc.setFontSize(12);
        doc.text(
          "Funds Deposit Records",
          doc.internal.pageSize.getWidth() - 118,
          19,
          { align: "right" }
        ); // Add text aligned to the right
        doc.text(
          "Date: " + moment(new Date()).format("MMMM DD YYYY"),
          doc.internal.pageSize.getWidth() - 10,
          19,
          { align: "right" }
        ); // Add text aligned to the right
        doc.autoTable(tableColumn, generateTableRows(pagePayments), {
          startY: 30,
        });
        doc.setFontSize(10);
        doc.text(
          `Page ${i + 1} of ${totalPages}`,
          doc.internal.pageSize.getWidth() - 10,
          doc.internal.pageSize.getHeight() - 10,
          {
            align: "right",
          }
        ); // Add page number at the bottom

        // Add new page if not the last page
        if (i !== totalPages - 1) {
          doc.addPage();
        }
      }
    };

    generatePDFPages();

    doc.save(`jukti-funds-deposit-records-${new Date().getTime()}.pdf`);
  };

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
      <h2 className="text-2xl text-white mb-6">All Deposits</h2>
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex flex-wrap mb-4">
          <div className="mr-4">
            <label htmlFor="month" className="block text-white">
              Month:
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
            >
              {getMonthOptions()}
            </select>
          </div>
          <div className="mr-4">
            <label htmlFor="year" className="block text-white">
              Year:
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
            >
              {getYearOptions()}
            </select>
          </div>
          <div className="mr-4">
            <label htmlFor="department" className="block text-white">
              Department:
            </label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
            >
              <option value="">All</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mr-4">
            <label htmlFor="user" className="block text-white">
              User:
            </label>
            <input
              type="text"
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
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
        <div className="mb-4 flex justify-between">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none mr-2"
            onClick={handleResetFilter}
          >
            Reset Filter
          </button>
          <button
            className="flex items-center bg-transparent text-jukti-orange"
            onClick={handleDownloadPDF}
          >
            <FontAwesomeIcon icon={faFilePdf} className="m-2 w-8 h-8" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
      {paginatedPayments.length > 0 ? (
        <div className="overflow-x-auto bg-gray-800 p-2 rounded-xl">
          <div className="w-full">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Name
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Position
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Department
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Month
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Year
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Method
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Number
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Trx ID
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="text-white py-2 px-2 border-b">
                      {getUser(payment.email)?.name}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {getUser(payment.email)?.position}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {getUser(payment.email)?.department}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {payment.month}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {payment.year}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {payment.paymentMethod}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {payment.number}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {payment.transactionId}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {payment.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-white">No payments found.</p>
      )}
      {payments.length > perPage && (
        <div class="pagination flex justify-center pt-4">
          <button
            className={`previous rounded-l py-2 px-4 ${
              currentPage === 0
                ? "text-gray-400"
                : "text-gray-200 hover:text-gray-400"
            }`}
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Previous
          </button>
          <div class="page-numbers flex flex-wrap">
            {Array(pageCount)
              .fill(0)
              .map((_, page) => (
                <button
                  key={page}
                  class={
                    page === currentPage
                      ? "bg-blue-500 text-white py-2 px-4 rounded"
                      : "text-gray-200 py-2 px-4 rounded"
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page + 1}
                </button>
              ))}
          </div>
          <button
            className={`next rounded-r py-2 px-4 ${
              currentPage === pageCount - 1
                ? "text-gray-400"
                : "text-gray-200 hover:text-gray-400"
            }`}
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const AllExpenseContent = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [perPage] = useState(10);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const fetchData = async () => {
    try {
      const expensesRef = ref(db, "expenses");
      const usersRef = ref(db, "users");
      const departmentsRef = ref(db, "departments");

      const [expensesSnapshot, usersSnapshot, departmentsSnapshot] =
        await Promise.all([
          get(expensesRef),
          get(usersRef),
          get(departmentsRef),
        ]);

      if (expensesSnapshot.exists()) {
        const expensesData = expensesSnapshot.val();
        const expenses = Object.entries(expensesData)
          .filter(([_, expense]) => expense.status === "Accepted")
          .map(([id, expense]) => ({ id, ...expense }));
        setExpenses(expenses);
        setFilteredExpenses(expenses);
      } else {
        setExpenses([]);
        setFilteredExpenses([]);
      }

      if (usersSnapshot.exists()) {
        const usersData = usersSnapshot.val();
        const users = Object.entries(usersData).map(([id, user]) => ({
          id,
          ...user,
        }));
        setAllUsers(users);
      } else {
        setAllUsers([]);
      }

      if (departmentsSnapshot.exists()) {
        const departmentsData = departmentsSnapshot.val();
        const departments = Object.entries(departmentsData).map(
          ([id, department]) => ({ id, ...department })
        );
        setDepartments(departments);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filteredExpenses = [...expenses];

    if (selectedDepartment !== "") {
      filteredExpenses = filteredExpenses.filter((expense) => {
        const user = allUsers.find((user) => user.email === expense.email);
        return user && user.department === selectedDepartment;
      });
    }

    if (selectedUser !== "") {
      const filterName = selectedUser.toLowerCase();
      const filteredUsers = allUsers.filter((user) =>
        user.name.toLowerCase().includes(filterName)
      );

      if (filteredUsers.length > 0) {
        const filteredEmails = filteredUsers.map((user) => user.email);
        filteredExpenses = filteredExpenses.filter((expense) =>
          filteredEmails.includes(expense.email)
        );
      } else {
        filteredExpenses = [];
      }
    }

    setFilteredExpenses(filteredExpenses);
  }, [selectedDepartment, selectedUser, expenses, allUsers]);

  const getUser = (email) => {
    const user = allUsers.find((user) => user.email === email);
    return user ? user : null;
  };

  const handleResetFilter = () => {
    setSelectedDepartment("");
    setSelectedUser("");
    setFilteredExpenses(expenses);
  };

  const offset = currentPage * perPage;
  const paginatedExpenses = filteredExpenses.slice(offset, offset + perPage);
  const pageCount = Math.ceil(filteredExpenses.length / perPage);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    const tableColumn = [
      "Name",
      "Position",
      "Department",
      "Date",
      "Amount",
      "Title",
      "Method",
      "Payment Details",
      "Trx ID",
    ];

    const generateTableRows = () => {
      const tableRows = [];
      filteredExpenses.forEach((expense) => {
        const user = getUser(expense.email);
        const rowData = [
          user.name,
          user.position,
          user.department,
          expense.date,
          expense.amount,
          expense.title,
          expense.paymentMethod,
          expense.paymentMethodDetails,
          expense.transactionId,
        ];
        tableRows.push(rowData);
      });
      return tableRows;
    };

    const generatePDFPages = () => {
      const totalPages = Math.ceil(filteredExpenses.length / perPage);
      const pdfPages = [];
      for (let i = 0; i < totalPages; i++) {
        const start = i * perPage;
        const end = start + perPage;
        const pageExpenses = filteredExpenses.slice(start, end);

        doc.addImage("jukti.png", "PNG", 10, 8, 33, 19);
        doc.setFontSize(12);
        doc.text(
          "Funds Expense Records",
          doc.internal.pageSize.getWidth() - 118,
          19,
          { align: "right" }
        ); // Add text aligned to the right
        doc.text(
          "Date: " + moment(new Date()).format("MMMM DD YYYY"),
          doc.internal.pageSize.getWidth() - 10,
          19,
          { align: "right" }
        ); // Add text aligned to the right

        doc.autoTable(tableColumn, generateTableRows(pageExpenses), {
          startY: 30,
        });
        doc.setFontSize(10);
        doc.text(
          `Page ${i + 1} of ${totalPages}`,
          doc.internal.pageSize.getWidth() - 10,
          doc.internal.pageSize.getHeight() - 10,
          {
            align: "right",
          }
        ); // Add page number at the bottom

        // Add new page if not the last page
        if (i !== totalPages - 1) {
          doc.addPage();
        }
      }
    };

    generatePDFPages();

    doc.save(`jukti-funds-expense-records-${new Date().getTime()}.pdf`);
  };

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
      <h2 className="text-2xl text-white mb-6">All Expenses</h2>
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex flex-wrap mb-4">
          <div className="mr-4">
            <label htmlFor="department" className="block text-white">
              Department:
            </label>
            <select
              id="department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
            >
              <option value="">All</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mr-4">
            <label htmlFor="user" className="block text-white">
              User:
            </label>
            <input
              type="text"
              id="user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
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
        <div className="mb-4 flex justify-between">
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none mr-2"
            onClick={handleResetFilter}
          >
            Reset Filter
          </button>
          <button
            className="flex items-center bg-transparent text-jukti-orange"
            onClick={handleDownloadPDF}
          >
            <FontAwesomeIcon icon={faFilePdf} className="m-2 w-8 h-8" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
      {paginatedExpenses.length > 0 ? (
        <div className="overflow-x-auto bg-gray-800 p-2 rounded-xl">
          <div className="w-full">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Name
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Position
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Department
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Date
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Amount
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Title
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Details
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Method
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Payment Details
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    Trx ID
                  </th>
                  <th className="text-gray-300 text-left py-2 px-2 border-b">
                    File
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="text-white py-2 px-2 border-b">
                      {getUser(expense.email)?.name}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {getUser(expense.email)?.position}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {getUser(expense.email)?.department}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {expense.date}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {expense.amount}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {expense.title}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {expense.details}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {expense.paymentMethod}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {expense.paymentMethodDetails}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      {expense.transactionId}
                    </td>
                    <td className="text-white py-2 px-2 border-b">
                      <Link
                        href={expense.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 p-4 rounded-xl">
          <p className="text-white">No expenses found.</p>
        </div>
      )}
      {filteredExpenses.length > perPage && (
        <div class="pagination flex justify-center pt-4">
          <button
            className={`previous rounded-l py-2 px-4 ${
              currentPage === 0
                ? "text-gray-400"
                : "text-gray-200 hover:text-gray-400"
            }`}
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Previous
          </button>
          <div class="page-numbers flex flex-wrap">
            {Array(pageCount)
              .fill(0)
              .map((_, page) => (
                <button
                  key={page}
                  class={
                    page === currentPage
                      ? "bg-blue-500 text-white py-2 px-4 rounded"
                      : "text-gray-200 py-2 px-4 rounded"
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page + 1}
                </button>
              ))}
          </div>
          <button
            className={`next rounded-r py-2 px-4 ${
              currentPage === pageCount - 1
                ? "text-gray-400"
                : "text-gray-200 hover:text-gray-400"
            }`}
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const PaymentHistoryContent = () => {
  const [deposits, setDeposits] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const expensesRef = ref(db, "expenses");
  const depositsRef = ref(db, "payments");

  useEffect(() => {
    const expenseListener = onValue(expensesRef, fetchExpenses);
    return () => {
      off(expensesRef, "value", expenseListener);
    };
  }, []);

  const fetchExpenses = (snapshot) => {
    if (snapshot.exists()) {
      const expensesList = snapshot.val();
      const expenses = Object.keys(expensesList)
        .filter((key) => expensesList[key].email === jsCookie.get("userEmail"))
        .map((key) => ({
          id: key,
          ...expensesList[key],
        }));
      setExpenses(expenses);
    }
  };

  useEffect(() => {
    const depositListener = onValue(depositsRef, fetchDeposits);
    return () => {
      off(depositsRef, "value", depositListener);
    };
  }, []);

  const fetchDeposits = (snapshot) => {
    if (snapshot.exists()) {
      const depositsList = snapshot.val();
      const deposits = Object.keys(depositsList)
        .filter((key) => depositsList[key].email === jsCookie.get("userEmail"))
        .map((key) => ({
          id: key,
          ...depositsList[key],
        }));
      setDeposits(deposits);
    }
  };

  const getStatusButton = (payment) => {
    if (payment.status === "Pending") {
      return (
        <button className="bg-jukti-orange hover:bg-jukti-orange text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline">
          Pending
        </button>
      );
    } else if (payment.status === "Accepted") {
      return (
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline">
          Accepted
        </button>
      );
    } else if (payment.status === "Rejected") {
      return (
        <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline">
          Rejected
        </button>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
      <h2 className="text-2xl text-white mb-6">Payment History</h2>
      {/* Deposit Section */}
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex items-center justify-between w-full bg-gray-800 text-white py-2 px-4 rounded-lg focus:outline-none">
              <span className="text-xl">Deposits</span>
              <ChevronDownIcon
                className={`${
                  open ? "transform rotate-180" : ""
                } w-5 h-5 text-white`}
              />
            </Disclosure.Button>
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel className="bg-gray-800 p-2 rounded-xl mt-2">
                {deposits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Month
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Year
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Method
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Number
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Transaction ID
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Amount
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Render deposit payments */}
                        {deposits.map((deposit) => (
                          <tr key={deposit.id}>
                            <td className="text-white py-2 px-2 border-b">
                              {deposit.month}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {deposit.year}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {deposit.paymentMethod}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {deposit.number}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {deposit.transactionId}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {deposit.amount}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {getStatusButton(deposit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-white">No pending deposits found.</p>
                )}
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

      {/* Expense Section */}
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex items-center justify-between w-full bg-gray-800 text-white py-2 px-4 rounded-lg mt-4 focus:outline-none">
              <span className="text-xl">Expenses</span>
              <ChevronDownIcon
                className={`${
                  open ? "transform rotate-180" : ""
                } w-5 h-5 text-white`}
              />
            </Disclosure.Button>
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel className="bg-gray-800 p-2 rounded-xl mt-2">
                {expenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Date
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Title
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Details
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Method
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Amount
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            File
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Trx ID
                          </th>
                          <th className="text-gray-300 text-left py-2 px-2 border-b">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Render expense payments */}
                        {expenses.map((expense) => (
                          <tr key={expense.id}>
                            <td className="text-white py-2 px-2 border-b">
                              {expense.date}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {expense.title}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              <div
                                className="formatted-text text-white"
                                style={{ whiteSpace: "pre-wrap" }}
                                dangerouslySetInnerHTML={{
                                  __html: expense.details,
                                }}
                              ></div>
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {expense.paymentMethod}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {expense.amount}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {expense.fileUrl ? (
                                <Link
                                  href={expense.fileUrl}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  View
                                </Link>
                              ) : (
                                "No file"
                              )}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {expense.transactionId}
                            </td>
                            <td className="text-white py-2 px-2 border-b">
                              {getStatusButton(expense)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-white">No pending expenses found.</p>
                )}
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    </div>
  );
};

const ProfileContent = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    contact: "",
    position: "",
    department: "",
    password: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const fetchUser = (email) => {
      const usersRef = ref(db, "users");
      const userQuery = query(usersRef, orderByChild("email"), equalTo(email));

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
    update(userRef, updatedUser).catch((error) => {
      alert("Error updating user in the database:", error);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));

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
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      alert("Error updating password:", error.message);
    }
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  return (
    <div className="">
      <h2 className="text-2xl text-white">Profile</h2>
      <div className="max-w-6xl grid w-screen grid-cols-1 py-2 mb-2 gap-4 justify-start rounded-lg md:grid-cols-2">
        <form className="mr-8" onSubmit={handleSubmit}>
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
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Update
          </button>
        </form>
        <form className="mr-8" onSubmit={handleChangePassword}>
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
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

const SettingsContent = () => {
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newPositionHierarchy, setNewPositionHierarchy] = useState(1);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newPaymentMethodDescription, setNewPaymentMethodDescription] =
    useState("");

  useEffect(() => {
    const departmentsRef = ref(db, "departments");
    const paymentMethodsRef = ref(db, "paymentMethods");

    onValue(departmentsRef, (snapshot) => {
      const departmentsData = snapshot.val();
      const departmentsList = [];

      snapshot.forEach((childSnapshot) => {
        const department = {
          id: childSnapshot.key,
          name: childSnapshot.val().name,
          positions: [],
        };

        const positionsSnapshot = childSnapshot.child("positions");
        positionsSnapshot.forEach((positionSnapshot) => {
          const position = {
            id: positionSnapshot.key,
            name: positionSnapshot.val().name,
            hierarchy: positionSnapshot.val().hierarchy,
          };
          department.positions.push(position);
        });

        departmentsList.push(department);
      });

      setDepartments(departmentsList);
    });

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
  }, []);

  const handleAddDepartment = () => {
    if (newDepartment.trim() !== "") {
      const departmentsRef = ref(db, "departments");
      const newDepartmentRef = push(departmentsRef);
      set(newDepartmentRef, {
        name: newDepartment,
        positions: [],
      });
      setNewDepartment("");
    }
  };

  const handleAddPosition = (departmentId) => {
    if (newPosition.trim() !== "") {
      const positionsRef = ref(db, `departments/${departmentId}/positions`);
      const newPositionRef = push(positionsRef);
      set(newPositionRef, {
        name: newPosition,
        hierarchy: newPositionHierarchy,
      });
      setNewPosition("");
      setNewPositionHierarchy(1);
    }
  };

  const handleAddPaymentMethod = () => {
    if (
      newPaymentMethod.trim() !== "" &&
      newPaymentMethodDescription.trim() !== ""
    ) {
      const paymentMethodsRef = ref(db, "paymentMethods");
      const newPaymentMethodRef = push(paymentMethodsRef);
      set(newPaymentMethodRef, {
        name: newPaymentMethod,
        description: newPaymentMethodDescription,
      });
      setNewPaymentMethod("");
      setNewPaymentMethodDescription("");
    }
  };

  const handleDeleteDepartment = (departmentId) => {
    const departmentRef = ref(db, `departments/${departmentId}`);
    remove(departmentRef);
  };

  const handleDeletePosition = (departmentId, positionId) => {
    const positionRef = ref(
      db,
      `departments/${departmentId}/positions/${positionId}`
    );
    remove(positionRef);
  };

  const handleDeletePaymentMethod = (paymentMethodId) => {
    const paymentMethodRef = ref(db, `paymentMethods/${paymentMethodId}`);
    remove(paymentMethodRef);
  };

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
      <h2 className="text-2xl text-white pb-4">Settings</h2>
      <div className="grid grid-cols-1 gap-4">
        {/* Departments */}
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                <h3 className="text-xl text-gray-300">Departments</h3>
                {open ? (
                  <ChevronUpIcon className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-white" />
                )}
              </Disclosure.Button>
              <Transition
                enter="transition duration-200 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition duration-150 ease-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Disclosure.Panel className="pb-4 px-4 rounded-lg">
                  <div className="flex flex-col">
                    {/* Department items */}
                    {departments.map((department) => (
                      <Disclosure key={department.id}>
                        {({ open }) => (
                          <>
                            <div className="flex items-center justify-between py-2">
                              <Disclosure.Button className="flex justify-between w-full px-4 mr-2 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                                <h4 className="text-lg text-white font-bold">
                                  {department.name}
                                </h4>
                                {open ? (
                                  <ChevronUpIcon className="w-5 h-5 text-white" />
                                ) : (
                                  <ChevronDownIcon className="w-5 h-5 text-white" />
                                )}
                              </Disclosure.Button>

                              <button
                                className="text-red-500"
                                onClick={() =>
                                  handleDeleteDepartment(department.id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                            <Transition
                              enter="transition duration-200 ease-out"
                              enterFrom="opacity-0"
                              enterTo="opacity-100"
                              leave="transition duration-150 ease-out"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Disclosure.Panel className="pl-4 my-2">
                                {/* Positions */}
                                <ul className="mb-4">
                                  {department.positions.map((position) => (
                                    <li
                                      key={position.id}
                                      className="flex items-center justify-between py-2"
                                    >
                                      <span className="text-white">
                                        {position.name} - {position.hierarchy}
                                      </span>
                                      <button
                                        className="text-red-500"
                                        onClick={() =>
                                          handleDeletePosition(
                                            department.id,
                                            position.id
                                          )
                                        }
                                      >
                                        Delete
                                      </button>
                                    </li>
                                  ))}
                                </ul>

                                {/* Add new position */}
                                <div className="flex items-center">
                                  <input
                                    type="text"
                                    placeholder="New Position"
                                    value={newPosition}
                                    onChange={(e) =>
                                      setNewPosition(e.target.value)
                                    }
                                    className="border border-gray-300 rounded-md px-3 py-2 mr-2"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Hierarchy"
                                    value={newPositionHierarchy}
                                    onChange={(e) =>
                                      setNewPositionHierarchy(
                                        parseInt(e.target.value)
                                      )
                                    }
                                    className="border border-gray-300 rounded-md px-3 py-2 mr-2"
                                  />
                                  <button
                                    className="bg-jukti-orange text-white px-4 py-2 rounded-md"
                                    onClick={() =>
                                      handleAddPosition(department.id)
                                    }
                                  >
                                    Add
                                  </button>
                                </div>
                              </Disclosure.Panel>
                            </Transition>
                          </>
                        )}
                      </Disclosure>
                    ))}

                    {/* Add new department */}
                    <div className="flex items-center pt-4">
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
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>

        {/* Payment Methods */}
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                <h3 className="text-xl text-gray-300">Payment Methods</h3>
                {open ? (
                  <ChevronUpIcon className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-white" />
                )}
              </Disclosure.Button>
              <Transition
                enter="transition duration-200 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition duration-150 ease-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Disclosure.Panel className="pb-4 px-4">
                  <div className="flex flex-col">
                    {/* Payment method items */}
                    {paymentMethods.map((paymentMethod) => (
                      <Disclosure key={paymentMethod.id}>
                        {({ open }) => (
                          <>
                            <div className="flex items-center justify-between py-2">
                              <Disclosure.Button className="flex justify-between w-full px-4 mr-2 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                                <h4 className="text-lg text-white font-bold">
                                  {paymentMethod.name}
                                </h4>

                                {open ? (
                                  <ChevronUpIcon className="w-5 h-5 text-white" />
                                ) : (
                                  <ChevronDownIcon className="w-5 h-5 text-white" />
                                )}
                              </Disclosure.Button>
                              <button
                                className="text-red-500"
                                onClick={() =>
                                  handleDeletePaymentMethod(paymentMethod.id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                            <Transition
                              enter="transition duration-200 ease-out"
                              enterFrom="opacity-0"
                              enterTo="opacity-100"
                              leave="transition duration-150 ease-out"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Disclosure.Panel className="pl-4 mt-2">
                                <div
                                  className="formatted-text text-white"
                                  style={{ whiteSpace: "pre-wrap" }}
                                  dangerouslySetInnerHTML={{
                                    __html: paymentMethod.description,
                                  }}
                                ></div>
                              </Disclosure.Panel>
                            </Transition>
                          </>
                        )}
                      </Disclosure>
                    ))}

                    {/* Add new payment method */}
                    <div className="flex items-center pt-4">
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
                      onChange={(e) =>
                        setNewPaymentMethodDescription(e.target.value)
                      }
                      className="border border-gray-300 rounded-md px-3 py-2 mr-2 my-2 w-full h-auto"
                    />
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </div>
    </div>
  );
};

const UsersContent = ({ isAdmin }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const usersRef = ref(db, "users");

    const getUsers = () => {
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const userList = Object.entries(data).map(([uid, user]) => ({
            uid,
            name: user.name,
            email: user.email,
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

  const departmentsRef = ref(db, "departments");

  const [departments, setDepartments] = useState([]);

  // Fetch departments data
  useEffect(() => {
    const departmentsRef = ref(db, "departments");

    const fetchDepartments = async () => {
      try {
        const snapshot = await get(departmentsRef);
        const departmentsData = snapshot.val();
        const departmentsList = [];

        snapshot.forEach((childSnapshot) => {
          const department = {
            id: childSnapshot.key,
            name: childSnapshot.val().name,
            positions: [],
          };

          const positionsSnapshot = childSnapshot.child("positions");
          positionsSnapshot.forEach((positionSnapshot) => {
            const position = {
              id: positionSnapshot.key,
              name: positionSnapshot.val().name,
              hierarchy: positionSnapshot.val().hierarchy,
            };
            department.positions.push(position);
          });

          departmentsList.push(department);
        });

        setDepartments(departmentsList);
        const [departments, setDepartments] = useState([]);

        // Fetch departments data
        useEffect(() => {
          const departmentsRef = ref(db, "departments");

          const fetchDepartments = async () => {
            try {
              const snapshot = await get(departmentsRef);
              const departmentsData = snapshot.val();
              const departmentsList = [];

              snapshot.forEach((childSnapshot) => {
                const department = {
                  id: childSnapshot.key,
                  name: childSnapshot.val().name,
                  positions: [],
                };

                const positionsSnapshot = childSnapshot.child("positions");
                positionsSnapshot.forEach((positionSnapshot) => {
                  const position = {
                    id: positionSnapshot.key,
                    name: positionSnapshot.val().name,
                    hierarchy: positionSnapshot.val().hierarchy,
                  };
                  department.positions.push(position);
                });

                departmentsList.push(department);
              });

              setDepartments(departmentsList);
            } catch (error) {
              console.error("Error fetching departments:", error);
            }
          };

          fetchDepartments();
        }, []);

        const getHierarchy = (department, position) => {
          const departmentData = departments.find((d) => d.name === department);
          if (departmentData) {
            const positionData = departmentData.positions.find(
              (p) => p.name === position
            );
            if (positionData) {
              return positionData.hierarchy;
            }
          }
          return -1; // Return a default value if hierarchy is not found
        };

        // Iterate over departments in groupedUsers
        Object.keys(groupedUsers).forEach((department) => {
          groupedUsers[department] = groupedUsers[department].sort((a, b) => {
            return (
              getHierarchy(department, a.position) -
              getHierarchy(department, b.position)
            );
          });
        });
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  const getHierarchy = (department, position) => {
    const departmentData = departments.find((d) => d.name === department);
    if (departmentData) {
      const positionData = departmentData.positions.find(
        (p) => p.name === position
      );
      if (positionData) {
        return positionData.hierarchy;
      }
    }
    return -1; // Return a default value if hierarchy is not found
  };

  // Iterate over departments in groupedUsers
  Object.keys(groupedUsers).forEach((department) => {
    groupedUsers[department] = groupedUsers[department].sort((a, b) => {
      return (
        getHierarchy(department, a.position) -
        getHierarchy(department, b.position)
      );
    });
  });

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
      <h2 className="text-2xl text-white">Board Members</h2>
      {Object.entries(groupedUsers).map(([department, departmentUsers]) => (
        <div key={department} className="mt-8">
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                  <span>{department}</span>
                  {open ? (
                    <ChevronUpIcon className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-white" />
                  )}
                </Disclosure.Button>
                <Transition
                  enter="transition duration-200 ease-out"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition duration-150 ease-out"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Disclosure.Panel className="pt-4 pb-2 text-sm text-white">
                    <div className="overflow-x-auto bg-gray-800 rounded-xl">
                      <div className="w-full">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="text-gray-300 text-left py-2 px-4 border-b">
                                Name
                              </th>
                              <th className="text-gray-300 text-left py-2 px-4 border-b">
                                Position
                              </th>
                              <th className="text-gray-300 text-left py-2 px-4 border-b">
                                Department
                              </th>
                              <th className="text-gray-300 text-left py-2 px-4 border-b">
                                Email
                              </th>
                              <th className="text-gray-300 text-left py-2 px-4 border-b">
                                Contact
                              </th>
                              {isAdmin && (
                                <th className="text-gray-300 text-left py-2 px-4 border-b">
                                  Admin
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {departmentUsers.map((user) => (
                              <tr key={user.uid}>
                                <td className="text-white py-2 px-4 border-b">
                                  {user.name}
                                </td>
                                <td className="text-white py-2 px-4 border-b">
                                  {user.position}
                                </td>
                                <td className="text-white py-2 px-4 border-b">
                                  {user.department}
                                </td>
                                <td className="text-white py-2 px-4 border-b">
                                  {user.email}
                                </td>
                                <td className="text-white py-2 px-4 border-b">
                                  {user.contact}
                                </td>
                                {isAdmin && (
                                  <td className="text-white text-center py-2 px-4 border-b">
                                    <input
                                      type="checkbox"
                                      checked={user.isAdmin}
                                      onChange={(e) =>
                                        handleAdminCheckboxChange(
                                          user.uid,
                                          e.target.checked
                                        )
                                      }
                                    />
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Disclosure.Panel>
                </Transition>
              </>
            )}
          </Disclosure>
        </div>
      ))}
    </div>
  );
};

const ReportsContent = ({ currentUserName, currentUserPosition }) => {
  const currentDate = new Date();
  const [monthlyDeposit, setMonthlyDeposit] = useState({});
  const [monthlyExpense, setMonthlyExpense] = useState({});
  const [selectedDepositMonth, setSelectedDepositMonth] = useState("");
  const [selectedDepositYear, setSelectedDepositYear] = useState("");
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState("");
  const [selectedExpenseYear, setSelectedExpenseYear] = useState("");
  const [defaulters, setDefaulters] = useState({});
  const [selectedDefaulterMonth, setSelectedDefaulterMonth] = useState(
    currentDate.toLocaleString("default", { month: "long" })
  );
  const [selectedDefaulterYear, setSelectedDefaulterYear] = useState(
    currentDate.getFullYear().toString()
  );
  const [allPaymentMethods, setAllPaymentMethods] = useState([]);

  useEffect(() => {
    const fetchPaymentMethods = () => {
      const paymentMethodsRef = ref(db, "paymentMethods");

      onValue(paymentMethodsRef, (snapshot) => {
        if (snapshot.exists()) {
          const paymentMethodsData = snapshot.val();
          const paymentMethods = Object.values(paymentMethodsData);
          setAllPaymentMethods(paymentMethods);
        } else {
          setAllPaymentMethods([]);
        }
      });
    };

    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    const fetchPaymentData = () => {
      const paymentsRef = ref(db, "payments");

      onValue(paymentsRef, (snapshot) => {
        if (snapshot.exists()) {
          const paymentData = snapshot.val();
          const payments = Object.values(paymentData);
          const defaulterPayments = Object.values(paymentData);
          const summary = calculateMonthlyDeposit(
            applyDepositFilters(payments)
          );
          const defaulter = fetchDefaulters(
            applyDefaulterFilters(defaulterPayments)
          );
          setDefaulters(defaulter);
          setMonthlyDeposit(summary);
        } else {
          setMonthlyDeposit({});
        }
      });
    };

    fetchPaymentData();
  }, [
    selectedDepositMonth,
    selectedDepositYear,
    selectedDefaulterMonth,
    selectedDefaulterYear,
  ]);

  useEffect(() => {
    const fetchExpenseData = () => {
      const expensesRef = ref(db, "expenses");

      onValue(expensesRef, (snapshot) => {
        if (snapshot.exists()) {
          const expenseData = snapshot.val();
          const expenses = Object.values(expenseData);
          const summary = calculateMonthlyExpense(
            applyExpenseFilters(expenses)
          );
          setMonthlyExpense(summary);
        } else {
          setMonthlyExpense({});
        }
      });
    };

    fetchExpenseData();
  }, [selectedExpenseMonth, selectedExpenseYear]);

  const calculateMonthlyDeposit = (payments) => {
    const deposit = {};

    for (const payment of payments) {
      const { month, year, amount, paymentMethod } = payment;
      const key = `${month}-${year}`;

      if (deposit[key]) {
        if (deposit[key][paymentMethod]) {
          deposit[key][paymentMethod] += parseFloat(amount);
        } else {
          deposit[key][paymentMethod] = parseFloat(amount);
        }
      } else {
        deposit[key] = {
          [paymentMethod]: parseFloat(amount),
        };
      }
    }

    // Calculate the total for each payment method
    for (const key in deposit) {
      const paymentMethods = deposit[key];
      let total = 0;
      for (const method in paymentMethods) {
        if (method !== "total") {
          total += paymentMethods[method];
        }
      }
      paymentMethods.total = total;
    }

    return deposit;
  };

  const calculateDepositTotal = (paymentMethod) => {
    let grandTotal = 0;

    for (const key in monthlyDeposit) {
      const paymentMethods = monthlyDeposit[key];

      if (paymentMethods[paymentMethod]) {
        grandTotal += paymentMethods[paymentMethod];
      }
    }

    return grandTotal;
  };

  const calculateMonthlyExpense = (expenses) => {
    const monthlyExpense = {};

    for (const expenseItem of expenses) {
      const { date, amount, paymentMethod } = expenseItem;
      const [year, month] = date.split("-");
      const monthName = new Date(date).toLocaleString("en-US", {
        month: "long",
      });
      const key = `${monthName}-${year}`;

      if (monthlyExpense[key]) {
        if (monthlyExpense[key][paymentMethod]) {
          monthlyExpense[key][paymentMethod] += parseFloat(amount);
        } else {
          monthlyExpense[key][paymentMethod] = parseFloat(amount);
        }
      } else {
        monthlyExpense[key] = {
          [paymentMethod]: parseFloat(amount),
        };
      }
    }

    // Calculate the total for each payment method
    for (const key in monthlyExpense) {
      const paymentMethods = monthlyExpense[key];
      let total = 0;
      for (const method in paymentMethods) {
        if (method !== "total") {
          total += paymentMethods[method];
        }
      }
      paymentMethods.total = total;
    }

    return monthlyExpense;
  };

  const calculateExpenseTotal = (paymentMethod) => {
    let grandTotal = 0;

    for (const key in monthlyExpense) {
      const paymentMethods = monthlyExpense[key];

      if (paymentMethods[paymentMethod]) {
        grandTotal += paymentMethods[paymentMethod];
      }
    }

    return grandTotal;
  };

  const getCashInHand = (paymentMethod) => {
    let cashInHand = 0;
    const totalDeposit = calculateDepositTotal(paymentMethod);
    const totalExpense = calculateExpenseTotal(paymentMethod);
    cashInHand = totalDeposit - totalExpense;
    return cashInHand;
  };

  const fetchDefaulters = (payments) => {
    const defaulters = {};
    const users = [];
    const keys = new Set();

    const usersRef = ref(db, "users");

    onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      snapshot.forEach((childSnapshot) => {
        const user = {
          name: childSnapshot.val().name,
          email: childSnapshot.val().email,
          position: childSnapshot.val().position,
          department: childSnapshot.val().department,
        };
        users.push(user);
      });
    });

    for (const payment of payments) {
      const { month, year, email } = payment;
      const key = `${month}-${year}`;
      keys.add(key);
    }

    for (const key of keys) {
      const [month, year] = key.split("-");

      const defaulterEmails = users
        .filter((user) => {
          for (const payment of payments) {
            if (
              payment.month === month &&
              payment.year === year &&
              payment.email === user.email
            ) {
              return false;
            }
          }
          return true;
        })
        .map((user) => user.email);

      for (const email of defaulterEmails) {
        users.forEach((user) => {
          if (user.email === email) {
            if (defaulters[key]) {
              defaulters[key].push(user);
            } else {
              defaulters[key] = [user];
            }
          }
        });
      }
    }
    return defaulters;
  };

  const applyDepositFilters = (payments) => {
    let filteredPayments = [...payments];
    filteredPayments = filteredPayments.filter(
      (payment) => payment.status === "Accepted"
    );
    if (selectedDepositMonth !== "") {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.month === selectedDepositMonth
      );
    }
    if (selectedDepositYear !== "") {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.year === selectedDepositYear
      );
    }
    return filteredPayments;
  };

  const applyExpenseFilters = (expenses) => {
    let filteredExpenses = [...expenses];
    filteredExpenses = filteredExpenses.filter(
      (expense) => expense.status === "Accepted"
    );
    if (selectedExpenseMonth !== "") {
      filteredExpenses = filteredExpenses.filter((expense) => {
        const [year, month] = expense.date.split("-");
        const monthName = new Date(expense.date).toLocaleString("en-US", {
          month: "long",
        });
        return monthName === selectedExpenseMonth;
      });
    }

    if (selectedExpenseYear !== "") {
      filteredExpenses = filteredExpenses.filter((expense) => {
        const [year, month] = expense.date.split("-");
        return year === selectedExpenseYear;
      });
    }
    return filteredExpenses;
  };

  const applyDefaulterFilters = (payments) => {
    let filteredPayments = [...payments];
    if (selectedDefaulterMonth !== "") {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.month === selectedDefaulterMonth
      );
    }
    if (selectedDefaulterYear !== "") {
      filteredPayments = filteredPayments.filter(
        (payment) => payment.year === selectedDefaulterYear
      );
    }
    return filteredPayments;
  };

  const [showModal, setShowModal] = useState(false);

  const MyModal = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleEmailChange = (e) => {
      setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
      setPassword(e.target.value);
    };

    return (
      <>
        {showModal ? (
          <>
            <form className="bg-gray-800 rounded-lg p-6 text-white">
              <h3 className="text-xl font-semibold mb-2">
                Enter the credentials of the account you want to use to send the
                mail
              </h3>
              <p className="text-md mb-1">
                <strong>Email:</strong>{" "}
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  value={email}
                  onChange={handleEmailChange}
                />
              </p>
              <p className="text-md mb-1">
                <strong>Password:</strong>{" "}
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  value={password}
                  onChange={handlePasswordChange}
                />
              </p>
              <button
                className="bg-jukti-orange text-white px-4 py-2 rounded-md"
                onClick={() => handleDefaulterMail(email, password)}
                type="submit"
              >
                Send Mail
              </button>
            </form>
          </>
        ) : null}
      </>
    );
  };

  const handleDefaulterMail = async (email, password) => {
    setShowModal(false);
    const defaultersList =
      defaulters[`${selectedDefaulterMonth}-${selectedDefaulterYear}`];

    const mailBody = `Dear {name},\n\nThis is to inform you that you have not paid your dues for the month of ${selectedDefaulterMonth}, ${selectedDefaulterYear}.\n\nPlease pay your dues as soon as possible.\n\nRegards,\n${currentUserName},\n${currentUserPosition}, JUKTI - Official Club of CSE`;
    const mailSubject = `Payment Reminder for JUKTI Funds`;
    const mailer = `${position} - JUKTI - Official Club of CSE`;

    const requestBody = {
      userEmail: email,
      userPassword: password,
      defaultersList: defaultersList.map((defaulter) => ({
        ...defaulter,
        mailBody: mailBody.replace("{name}", defaulter.name),
      })),
      mailSubject,
      mailer,
    };

    try {
      const response = await fetch("/api/sendMail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        alert("Emails sent successfully");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error sending emails");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      alert("Error sending emails. Please try again later.");
    }
  };

  const handleDepositPDFDownload = () => {
    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Define table column headers
    const tableColumn = [
      "Month & Year",
      ...allPaymentMethods.map((paymentMethod) => paymentMethod.name),
      "Total",
    ];

    // Define table rows
    const tableRows = Object.entries(monthlyDeposit).map(
      ([key, paymentMethods]) => {
        const [month, year] = key.split("-");
        const rowData = [
          `${month} ${year}`,
          ...allPaymentMethods.map(
            (paymentMethod) => paymentMethods[paymentMethod.name] || 0
          ),
          paymentMethods.total || 0,
        ];
        return rowData;
      }
    );

    // Add table to the document
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
    });

    // Save the PDF with a unique name
    doc.save(`JUKTI-Funds-deposit-report-${new Date().getTime()}.pdf`);
  };

  const handleExpensePDFDownload = () => {
    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Define table column headers
    const tableColumn = [
      "Month & Year",
      ...allPaymentMethods.map((paymentMethod) => paymentMethod.name),
      "Total",
    ];

    // Define table rows
    const tableRows = Object.entries(monthlyExpense).map(
      ([key, paymentMethods]) => {
        const [month, year] = key.split("-");
        const rowData = [
          `${month} ${year}`,
          ...allPaymentMethods.map(
            (paymentMethod) => paymentMethods[paymentMethod.name] || 0
          ),
          paymentMethods.total || 0,
        ];
        return rowData;
      }
    );

    // Add table to the document
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
    });

    // Save the PDF with a unique name
    doc.save(`JUKTI-Funds-expense-report-${new Date().getTime()}.pdf`);
  };

  const handleDefaulterPDFDownload = () => {
    // Create a new jsPDF instance
    const doc = new jsPDF();

    // Define table column headers
    const tableColumn = ["Month & Year", "Name", "Position", "Department"];

    // Define table rows
    const tableRows = Object.entries(defaulters)
      .map(([key, defaultersList]) => {
        const [month, year] = key.split("-");
        const rowData = defaultersList.map((defaulter) => [
          `${month} ${year}`,
          defaulter.name,
          defaulter.position,
          defaulter.department,
        ]);
        return rowData;
      })
      .flat();

    // Add table to the document
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
    });

    // Save the PDF with a unique name
    doc.save(`JUKTI-Funds-defaulters-report-${new Date().getTime()}.pdf`);
  };

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
      <h2 className="text-2xl text-white mb-6">Reports</h2>
      <div className="grid grid-cols-1 gap-4">
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                <span className="text-lg">Cash in Hand</span>
                <ChevronDownIcon
                  className={`${
                    open ? "transform rotate-180" : ""
                  } w-5 h-5 text-white`}
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-200 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition duration-150 ease-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-white">
                  <div className="overflow-x-auto bg-gray-800 p-4 rounded-xl">
                    <div className="w-full">
                      <table className="w-full">
                        <thead>
                          <tr>
                            {allPaymentMethods.map((paymentMethod) => (
                              <th
                                className="text-gray-300 text-left py-2 px-4 border-b"
                                key={paymentMethod.name}
                              >
                                {paymentMethod.name}
                              </th>
                            ))}
                            <th className="text-gray-300 text-left py-2 px-4 border-b">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {allPaymentMethods.map((paymentMethod) => (
                              <td
                                className="text-gray-100 py-2 px-4 border-b"
                                key={paymentMethod.name}
                              >
                                {getCashInHand(paymentMethod.name) || 0}
                              </td>
                            ))}
                            <td className="text-gray-100 py-2 px-4 border-b">
                              {getCashInHand("total") || 0}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                <h2 className="text-white text-xl">Monthly Collection</h2>
                <ChevronDownIcon
                  className={`${
                    open ? "transform rotate-180" : ""
                  } w-5 h-5 text-white`}
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-200 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition duration-150 ease-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-white">
                  <div className="flex flex-wrap justify-between items-center mb-4">
                    <div className="flex flex-wrap">
                      <div className="mr-4">
                        <label htmlFor="month" className="block text-white">
                          Month:
                        </label>
                        <select
                          id="month"
                          value={selectedDepositMonth}
                          onChange={(e) =>
                            setSelectedDepositMonth(e.target.value)
                          }
                          className="px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none"
                        >
                          {getMonthOptions()}
                        </select>
                      </div>
                      <div className="mr-4">
                        <label htmlFor="year" className="block text-white">
                          Year:
                        </label>
                        <select
                          id="year"
                          value={selectedDepositYear}
                          onChange={(e) =>
                            setSelectedDepositYear(e.target.value)
                          }
                          className="px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none"
                        >
                          {getYearOptions()}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <button
                        className="flex items-center bg-transparent text-jukti-orange"
                        onClick={handleDepositPDFDownload}
                      >
                        <FontAwesomeIcon
                          icon={faFilePdf}
                          className="m-2 w-8 h-8"
                        />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto bg-gray-800 p-4 rounded-xl">
                    <div className="w-full">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-gray-300 text-left py-2 px-4 border-b">
                              Month & Year
                            </th>
                            {allPaymentMethods.map((paymentMethod) => (
                              <th
                                className="text-gray-300 text-left py-2 px-4 border-b"
                                key={paymentMethod.name}
                              >
                                {paymentMethod.name}
                              </th>
                            ))}
                            <th className="text-gray-300 text-left py-2 px-4 border-b">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(monthlyDeposit).map(
                            ([key, paymentMethods]) => {
                              const [month, year] = key.split("-");
                              return (
                                <tr key={key}>
                                  <td className="text-white py-2 px-4 border-b">
                                    {month} {year}
                                  </td>
                                  {allPaymentMethods.map((paymentMethod) => (
                                    <td
                                      className="text-white py-2 px-4 border-b"
                                      key={paymentMethod.name}
                                    >
                                      {paymentMethods[paymentMethod.name] || 0}
                                    </td>
                                  ))}
                                  <td className="text-white py-2 px-4 border-b">
                                    {paymentMethods.total || 0}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                          <tr>
                            <td className="text-jukti-orange py-2 px-4 border-b">
                              Grand Total
                            </td>
                            {allPaymentMethods.map((paymentMethod) => (
                              <td
                                className="text-jukti-orange py-2 px-4 border-b"
                                key={paymentMethod.name}
                              >
                                {calculateDepositTotal(paymentMethod.name)}
                              </td>
                            ))}
                            <td className="text-jukti-orange py-2 px-4 border-b">
                              {calculateDepositTotal("total")}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                <h2 className="text-white text-xl">Monthly Expenses</h2>
                <ChevronDownIcon
                  className={`${
                    open ? "transform rotate-180" : ""
                  } w-5 h-5 text-white`}
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-200 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition duration-150 ease-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-white">
                  <div className="flex flex-wrap justify-between items-center mb-4">
                    <div className="flex flex-wrap">
                      <div className="mr-4">
                        <label htmlFor="month" className="block text-white">
                          Month:
                        </label>
                        <select
                          id="month"
                          value={selectedExpenseMonth}
                          onChange={(e) =>
                            setSelectedExpenseMonth(e.target.value)
                          }
                          className="px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none"
                        >
                          {getMonthOptions()}
                        </select>
                      </div>
                      <div className="mr-4">
                        <label htmlFor="year" className="block text-white">
                          Year:
                        </label>
                        <select
                          id="year"
                          value={selectedExpenseYear}
                          onChange={(e) =>
                            setSelectedExpenseYear(e.target.value)
                          }
                          className="px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none"
                        >
                          {getYearOptions()}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <button
                        className="flex items-center bg-transparent text-jukti-orange"
                        onClick={handleExpensePDFDownload}
                      >
                        <FontAwesomeIcon
                          icon={faFilePdf}
                          className="m-2 w-8 h-8"
                        />
                        <span>Download PDF</span>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto bg-gray-800 p-4 rounded-xl">
                    <div className="w-full">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-gray-300 text-left py-2 px-4 border-b">
                              Month & Year
                            </th>
                            {allPaymentMethods.map((paymentMethod) => (
                              <th
                                className="text-gray-300 text-left py-2 px-4 border-b"
                                key={paymentMethod.name}
                              >
                                {paymentMethod.name}
                              </th>
                            ))}
                            <th className="text-gray-300 text-left py-2 px-4 border-b">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(monthlyExpense).map(
                            ([key, paymentMethods]) => {
                              const [month, year] = key.split("-");
                              return (
                                <tr key={key}>
                                  <td className="text-white py-2 px-4 border-b">
                                    {month} {year}
                                  </td>
                                  {allPaymentMethods.map((paymentMethod) => (
                                    <td
                                      className="text-white py-2 px-4 border-b"
                                      key={paymentMethod.name}
                                    >
                                      {paymentMethods[paymentMethod.name] || 0}
                                    </td>
                                  ))}
                                  <td className="text-white py-2 px-4 border-b">
                                    {paymentMethods.total || 0}
                                  </td>
                                </tr>
                              );
                            }
                          )}
                          <tr>
                            <td className="text-jukti-orange py-2 px-4 border-b">
                              Grand Total
                            </td>
                            {allPaymentMethods.map((paymentMethod) => (
                              <td
                                className="text-jukti-orange py-2 px-4 border-b"
                                key={paymentMethod.name}
                              >
                                {calculateExpenseTotal(paymentMethod.name)}
                              </td>
                            ))}
                            <td className="text-jukti-orange py-2 px-4 border-b">
                              {calculateExpenseTotal("total")}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                <h2 className="text-white text-xl">Defaulter Report</h2>
                <ChevronDownIcon
                  className={`${
                    open ? "transform rotate-180" : ""
                  } w-5 h-5 text-white`}
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-200 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition duration-150 ease-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-white">
                  <div className="flex flex-wrap justify-between items-center mb-4">
                    <div className="flex flex-wrap">
                      <div className="mr-4">
                        <label htmlFor="month" className="block text-white">
                          Month:
                        </label>
                        <select
                          id="month"
                          value={selectedDefaulterMonth}
                          onChange={(e) =>
                            setSelectedDefaulterMonth(e.target.value)
                          }
                          className="px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none"
                        >
                          {getMonthOptions()}
                        </select>
                      </div>
                      <div className="mr-4">
                        <label htmlFor="year" className="block text-white">
                          Year:
                        </label>
                        <select
                          id="year"
                          value={selectedDefaulterYear}
                          onChange={(e) =>
                            setSelectedDefaulterYear(e.target.value)
                          }
                          className="px-4 py-2 border text-black border-gray-300 rounded-md focus:outline-none"
                        >
                          <option value="">All</option>
                          {getYearOptions()}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <button
                        className="flex items-center bg-transparent text-jukti-orange"
                        onClick={handleDefaulterPDFDownload}
                      >
                        <FontAwesomeIcon
                          icon={faFilePdf}
                          className="m-2 w-8 h-8"
                        />
                        <span>Download PDF</span>
                      </button>
                      <button
                        className="flex items-center bg-transparent text-white"
                        onClick={() => setShowModal(true)}
                      >
                        <FontAwesomeIcon
                          icon={faMailBulk}
                          className="m-2 w-8 h-8"
                        />
                        <span>Send Reminder Email</span>
                      </button>
                    </div>
                  </div>
                  {showModal && <MyModal />}
                  <div className="overflow-x-auto bg-gray-800 p-2 rounded-xl">
                    <div className="w-full">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-gray-300 text-left py-2 px-4 border-b">
                              Month & Year
                            </th>
                            <th className="text-gray-300 text-left py-2 px-4 border-b">
                              Name
                            </th>
                            <th className="text-gray-300 text-left py-2 px-4 border-b">
                              Position
                            </th>
                            <th className="text-gray-300 text-left py-2 px-4 border-b">
                              Department
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(defaulters).map(
                            ([key, defaulterList]) => {
                              const [month, year] = key.split("-");
                              return (
                                <React.Fragment key={key}>
                                  {defaulterList.map((defaulter) => (
                                    <tr key={defaulter.email}>
                                      <td className="text-white py-2 px-4 border-b">
                                        {month} {year}
                                      </td>
                                      <td className="text-white py-2 px-4 border-b">
                                        {defaulter.name}
                                      </td>
                                      <td className="text-white py-2 px-4 border-b">
                                        {defaulter.position}
                                      </td>
                                      <td className="text-white py-2 px-4 border-b">
                                        {defaulter.department}
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      </div>
    </div>
  );
};

const CalenderContent = ({ department, isAdmin }) => {
  const [eventName, setEventName] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [eventStartDateTime, setEventStartDateTime] = useState("");
  const [eventEndDateTime, setEventEndDateTime] = useState("");
  const [eventType, setEventType] = useState("");
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [newEventType, setNewEventType] = useState("");
  const [newEventTypeColor, setNewEventTypeColor] = useState("#000000");

  const handleEventNameChange = (e) => {
    setEventName(e.target.value);
  };

  const handleEventDetailsChange = (e) => {
    setEventDetails(e.target.value);
  };

  const handleEventDateTimeChange = (fieldName, value) => {
    if (fieldName === "start") {
      setEventStartDateTime(value);
    } else if (fieldName === "end") {
      setEventEndDateTime(value);
    }
  };

  const handleEventTypeChange = (e) => {
    setEventType(e.target.value);
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();

    if (!eventName || !eventStartDateTime || !eventEndDateTime || !eventType) {
      alert("Please enter event name, start time, end time, and type.");
      return;
    }

    const newEvent = {
      title: eventName,
      details: eventDetails,
      start: eventStartDateTime,
      end: eventEndDateTime,
      type: eventType,
    };

    const eventsRef = ref(db, "events");
    push(eventsRef, newEvent);

    setEventName("");
    setEventDetails("");
    setEventStartDateTime("");
    setEventEndDateTime("");
    setEventType("");
  };

  useEffect(() => {
    const eventsRef = ref(db, "events");

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

    const eventTypesRef = ref(db, "eventTypes");

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

    if (newEventType.trim() !== "" && newEventTypeColor.trim() !== "") {
      const eventTypesRef = ref(db, "eventTypes");

      const type = {
        name: newEventType,
        color: newEventTypeColor,
      };

      const newEventTypeKey = push(eventTypesRef);
      const newEventTypeChildRef = newEventTypeKey.key;

      try {
        await set(newEventTypeKey, type);
        setNewEventType("");
        setNewEventTypeColor("#000000");
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleDeleteEventType = (eventTypeId) => {
    const eventTypeRef = ref(db, `eventTypes/${eventTypeId}`);
    remove(eventTypeRef);
  };

  const getEventColor = (event) => {
    const getEventType = eventTypes.find(
      (eventType) => eventType.name === event.type
    );
    if (getEventType) {
      return {
        style: {
          backgroundColor: getEventType.color,
        },
      };
    }
    return {};
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState({});

  const MyModal = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedEventName, setEditedEventName] = useState("");
    const [editedEventDetails, setEditedEventDetails] = useState("");
    const [editedEventStartDateTime, setEditedEventStartDateTime] =
      useState("");
    const [editedEventEndDateTime, setEditedEventEndDateTime] = useState("");
    const [editedEventType, setEditedEventType] = useState("");

    const handleEditedEventNameChange = (e) => {
      setEditedEventName(e.target.value);
    };

    const handleEditedEventDetailsChange = (e) => {
      setEditedEventDetails(e.target.value);
    };

    const handleEditedEventDateTimeChange = (fieldName, value) => {
      if (fieldName === "start") {
        setEditedEventStartDateTime(value);
      } else if (fieldName === "end") {
        setEditedEventEndDateTime(value);
      }
    };

    const handleEditedEventTypeChange = (e) => {
      setEditedEventType(e.target.value);
    };

    const handleDeleteEvent = () => {
      const eventRef = ref(db, `events/${selectedEvent.id}`);
      remove(eventRef);
      setShowModal(false);
    };

    const handleUpdateEvent = (e) => {
      e.preventDefault();

      if (
        !editedEventName ||
        !editedEventStartDateTime ||
        !editedEventEndDateTime ||
        !editedEventType
      ) {
        alert("Please enter event name, start time, end time, and type.");
        return;
      }

      const updatedEvent = {
        title: editedEventName,
        details: editedEventDetails,
        start: editedEventStartDateTime,
        end: editedEventEndDateTime,
        type: editedEventType,
      };
      const eventRef = ref(db, `events/${selectedEvent.id}`);
      update(eventRef, updatedEvent);

      setEditedEventName("");
      setEditedEventDetails("");
      setEditedEventStartDateTime("");
      setEditedEventEndDateTime("");
      setEditedEventType("");
      setIsEditing(false);
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
      setEditedEventName("");
      setEditedEventDetails("");
      setEditedEventStartDateTime("");
      setEditedEventEndDateTime("");
      setEditedEventType("");
    };

    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75"
        style={{ zIndex: 1000 }}
      >
        <div className="bg-gray-900 p-6 rounded-xl">
          <div className="text-left w-full ">
            <form
              onSubmit={isEditing ? handleUpdateEvent : handleCreateEvent}
              className="grid grid-cols-1"
            >
              <div className="flex flex-col">
                <label className="block text-white mb-1" htmlFor="eventName">
                  Event Name:
                </label>
                <input
                  className="px-2 py-1 rounded bg-gray-300"
                  type="text"
                  id="eventName"
                  value={isEditing ? editedEventName : selectedEvent.title}
                  onChange={
                    isEditing
                      ? handleEditedEventNameChange
                      : handleEventNameChange
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="flex flex-col py-2">
                <label className="block text-white mb-1" htmlFor="eventType">
                  Event Type:
                </label>
                <select
                  className="px-2 py-2 rounded bg-gray-300"
                  id="eventType"
                  value={isEditing ? editedEventType : selectedEvent.type}
                  onChange={
                    isEditing
                      ? handleEditedEventTypeChange
                      : handleEventTypeChange
                  }
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
                  onChange={
                    isEditing
                      ? handleEditedEventDetailsChange
                      : handleEventDetailsChange
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="flex flex-col py-2">
                <label
                  className="block text-white mb-1"
                  htmlFor="eventStartDateTime"
                >
                  Start Date & Time:
                </label>
                <input
                  className="px-2 py-1 rounded bg-gray-300"
                  type="datetime-local"
                  id="eventStartDateTime"
                  value={
                    isEditing
                      ? moment(editedEventStartDateTime).format(
                          "YYYY-MM-DDTHH:mm"
                        )
                      : moment(selectedEvent.start).format("YYYY-MM-DDTHH:mm")
                  }
                  onChange={(e) =>
                    handleEditedEventDateTimeChange("start", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="flex flex-col py-2">
                <label
                  className="block text-white mb-1"
                  htmlFor="eventEndDateTime"
                >
                  End Date & Time:
                </label>
                <input
                  className="px-2 py-1 rounded bg-gray-300"
                  type="datetime-local"
                  id="eventEndDateTime"
                  value={
                    isEditing
                      ? moment(editedEventEndDateTime).format(
                          "YYYY-MM-DDTHH:mm"
                        )
                      : moment(selectedEvent.end).format("YYYY-MM-DDTHH:mm")
                  }
                  onChange={(e) =>
                    handleEditedEventDateTimeChange("end", e.target.value)
                  }
                  disabled={!isEditing}
                />
              </div>
              {(department === "Public Relations" || isAdmin) && (
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
            <div className="bg-gray-900 py-4 flex flex-row-reverse">
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
      <h2 className="text-2xl text-white mb-6">Event Calendar</h2>
      <div className="mb-4">
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
            className="react-big-calendar rounded-lg p-6 w-full bg-gray-100"
            eventPropGetter={getEventColor}
          />
        </div>
        {showModal && <MyModal />}
        {(department === "Public Relations" || isAdmin) && (
          <div className="my-4">
            <h3 className="text-lg text-white">Create Event</h3>
            <form
              onSubmit={handleCreateEvent}
              className="grid sm:grid-cols-1 lg:grid-cols-6 py-2"
            >
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
                  required
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
                  required
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
                <label
                  className="block text-white mb-1"
                  htmlFor="eventStartDateTime"
                >
                  Start Date & Time:
                </label>
                <input
                  className="px-2 py-1 rounded"
                  type="datetime-local"
                  id="eventStartDateTime"
                  value={eventStartDateTime}
                  onChange={(e) =>
                    handleEventDateTimeChange("start", e.target.value)
                  }
                  required
                />
              </div>
              <div className="flex flex-col lg:ml-2">
                <label
                  className="block text-white mb-1"
                  htmlFor="eventEndDateTime"
                >
                  End Date & Time:
                </label>
                <input
                  className="px-2 py-1 rounded"
                  type="datetime-local"
                  id="eventEndDateTime"
                  value={eventEndDateTime}
                  onChange={(e) =>
                    handleEventDateTimeChange("end", e.target.value)
                  }
                  required
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
        <h3 className="text-lg text-white">Create Event Types</h3>
        {(department === "Public Relations" || isAdmin) && (
          <form
            onSubmit={handleCreateEventType}
            className="grid sm:grid-cols-1 lg:grid-cols-6 py-2"
          >
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
              <label
                className="block text-white mb-1"
                htmlFor="newEventTypeColor"
              >
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
              {(department === "Public Relations" || isAdmin) && (
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

const RecordExpenseContent = () => {
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseDetails, setExpenseDetails] = useState("");
  const [expensePaymentMethod, setExpensePaymentMethod] = useState("");
  const [expensePaymentMethodDetails, setExpensePaymentMethodDetails] =
    useState("");
  const [expenseFile, setExpenseFile] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    const paymentMethodsRef = ref(db, "paymentMethods");
    onValue(paymentMethodsRef, (snapshot) => {
      const paymentMethodsData = snapshot.val();
      const paymentMethodsList = [];

      snapshot.forEach((childSnapshot) => {
        const paymentMethod = {
          id: childSnapshot.key,
          ...childSnapshot.val(),
        };
        paymentMethodsList.push(paymentMethod);
      });

      setPaymentMethods(paymentMethodsList);
    });
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();

    const expense = {
      email: jsCookie.get("userEmail"),
      title: expenseTitle,
      amount: expenseAmount,
      date: expenseDate,
      details: expenseDetails,
      paymentMethod: expensePaymentMethod,
      paymentMethodDetails: expensePaymentMethodDetails,
      status: "Pending",
      fileUrl: await handleFileUpload(expenseFile),
    };
    await createExpense(expense);
  };

  const handleFileUpload = async (file) => {
    if (file) {
      const storage = getStorage(app);
      const storageRef = storagesRef(storage, `expenses/${file.name}`);
      try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Download URL:", downloadURL);
        return downloadURL;
      } catch (error) {
        console.error("Error uploading file:", error);
        return null;
      }
    }
    return null;
  };

  const createExpense = async (expense) => {
    try {
      const expensesRef = ref(db, "expenses");

      const newExpenseRef = push(expensesRef);
      const newExpenseKey = newExpenseRef.key;

      await set(newExpenseRef, expense);
      resetForm();

      console.log("Expense created successfully!");
    } catch (error) {
      console.error("Error creating expense:", error);
    }
  };

  const handleFileChange = async (file) => {
    if (
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "application/pdf" ||
      file.type === "image/jpg"
    ) {
      setExpenseFile(file);
    } else {
      alert("Upload png or jpg/jpeg or pdf files only!");
      setExpenseFile(null);
      fileInputRef.current.value = null;
    }
  };

  const resetForm = () => {
    setExpenseName("");
    setExpenseAmount("");
    setExpenseDate("");
    setExpenseDetails("");
    setExpensePaymentMethod("");
    setExpenseFile(null);
    fileInputRef.current.value = null;
    setExpensePaymentMethodDetails("");
  };

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
      <h2 className="text-2xl text-white">Record Expense</h2>
      <form
        onSubmit={handleCreateExpense}
        className="gap-4 py-16 justify-start rounded-lg"
      >
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="expenseTitle"
          >
            Expense Title
          </label>
          <input
            className="appearance-none bg-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            id="expenseTitle"
            type="text"
            placeholder="Subject of the expense"
            value={expenseTitle}
            onChange={(e) => setExpenseTitle(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 justify-between gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-300 text-sm font-bold mb-2"
              htmlFor="expenseAmount"
            >
              Amount Spent
            </label>
            <input
              className="appearance-none bg-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
              id="expenseAmount"
              type="number"
              placeholder="Amount in Taka"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-300 text-sm font-bold mb-2"
              htmlFor="expenseDate"
            >
              Date of Expense
            </label>
            <input
              className="appearance-none bg-gray-700 rounded w-full py-1.5 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
              id="expenseDate"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="expenseDetails"
          >
            Expense Details
          </label>
          <textarea
            className="appearance-none bg-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            id="expenseDetails"
            type="text"
            placeholder="Details of the expense"
            value={expenseDetails}
            onChange={(e) => setExpenseDetails(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 justify-between gap-2">
          <div className="mb-4">
            <label
              className="block text-gray-300 text-sm font-bold mb-2"
              htmlFor="expensePaymentMethod"
            >
              Reimbursement Payment Method
            </label>
            <select
              className="appearance-none bg-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
              id="expensePaymentMethod"
              value={expensePaymentMethod}
              onChange={(e) => setExpensePaymentMethod(e.target.value)}
              required
            >
              <option value="" disabled>
                Payment Method to receive reimbursement
              </option>
              {paymentMethods.map((paymentMethod) => (
                <option key={paymentMethod.id} value={paymentMethod.name}>
                  {paymentMethod.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-300 text-sm font-bold mb-2"
              htmlFor="expenseFile"
            >
              Invoice/Receipt
            </label>
            <input
              className="appearance-none bg-gray-700 rounded w-full py-1.5 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
              id="expenseFile"
              type="file"
              accept=".png, .jpg, .jpeg, .pdf"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
          </div>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="expensePaymentMethodDetails"
          >
            Details of Payment Method
          </label>
          <input
            className="appearance-none bg-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            id="expensePaymentMethodDetails"
            type="text"
            placeholder="Expense Payment Method Details"
            value={expensePaymentMethodDetails}
            onChange={(e) => setExpensePaymentMethodDetails(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <button
            className="w-full bg-jukti-orange hover:bg-jukti-orange-dark text-white font-bold px-3 py-2 rounded focus:outline-none"
            type="submit"
          >
            Record Expense
          </button>
        </div>
      </form>
    </div>
  );
};

const ReceivedFundsContent = () => {
  const [duplicate, setDuplicate] = useState(false);
  const [trxDuplicate, setTrxDuplicate] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [paymentData, setPaymentData] = useState({
    date: "",
    payer: "",
    title: "",
    description: "",
    paymentMethod: "",
    number: "",
    transactionId: "",
    amount: "",
    status: "Pending",
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
      alert("Funds for this month already received.");
    } else if (trxDuplicate) {
      alert("Transaction ID already exists.");
    } else {
      // Save paymentData to the database
      savePaymentData(paymentData);
      // Reset the form
      setPaymentData({
        date: "",
        payer: "",
        title: "",
        description: "",
        paymentMethod: "",
        number: "",
        transactionId: "",
        amount: "",
        status: "Pending",
      });
    }
  };

  useEffect(() => {
    const paymentMethodsRef = ref(db, "paymentMethods");
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
  }, []);

  const savePaymentData = (paymentData) => {
    const paymentsRef = ref(db, "receivedFunds");
    push(paymentsRef, {
      ...paymentData,
      email: jsCookie.get("userEmail"),
    });
  };

  const [showModal, setShowModal] = useState(false);

  const MyModal = () => {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75"
        style={{ zIndex: 1000 }}
      >
        <div className="max-w-6xl max-h-screen grid w-screen grid-cols-1 bg-gray-900 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl text-white px-4 py-2 rounded-t-lg">
              Payment Methods
            </h2>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block ml-4"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
          <div className="max-h-[calc(100vh-128px)] overflow-y-auto">
            {paymentMethods.length > 0 ? (
              paymentMethods.map((paymentMethod) => (
                <div key={paymentMethod.id} className="">
                  <Disclosure className="">
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="flex justify-between w-full px-4 py-2 my-4 text-sm font-medium text-left text-white bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                          <h3 className="text-xl">{paymentMethod.name}</h3>
                        </Disclosure.Button>
                        <Transition
                          enter="transition duration-200 ease-out"
                          enterFrom="opacity-0"
                          enterTo="opacity-100"
                          leave="transition duration-150 ease-out"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Disclosure.Panel className="px-4 pt-4 pb-2 text-white text-lg bg-gray-800 rounded-lg">
                            <div
                              className="formatted-text"
                              style={{ whiteSpace: "pre-wrap" }}
                              dangerouslySetInnerHTML={{
                                __html: paymentMethod.description,
                              }}
                            ></div>
                          </Disclosure.Panel>
                        </Transition>
                      </>
                    )}
                  </Disclosure>
                </div>
              ))
            ) : (
              <p className="text-white">No payment methods found.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl grid w-screen grid-cols-1 pr-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-white">Record Received Funds</h2>
        <button
          className="bg-jukti-orange hover:bg-jukti-orange-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block ml-4"
          onClick={() => setShowModal(true)}
        >
          Payment Methods
        </button>
        {showModal && <MyModal />}
      </div>
      <form
        className="gap-4 py-16 justify-start rounded-lg"
        onSubmit={handleFormSubmit}
      >
        <div className="grid grid-cols-2 justify-between gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-300 text-sm font-bold mb-2"
              htmlFor="date"
            >
              Payment Date
            </label>
            <input
              className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
              type="date"
              name="date"
              id="date"
              value={paymentData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-300 text-sm font-bold mb-2"
              htmlFor="payer"
            >
              Payer
            </label>
            <input
              className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              name="payer"
              id="payer"
              placeholder="Name of the payer"
              value={paymentData.payer}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="title"
          >
            Title
          </label>
          <input
            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="title"
            id="title"
            placeholder="Purpose of the fund received"
            value={paymentData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            name="description"
            id="description"
            placeholder="Description (optional)"
            value={paymentData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="paymentMethod"
          >
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
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="number"
          >
            Number
          </label>
          <input
            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="number"
            id="number"
            placeholder="Account Number / Mobile Number"
            value={paymentData.number}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="transactionId"
          >
            Transaction ID
          </label>
          <input
            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="transactionId"
            id="transactionId"
            placeholder="Last 5 Digits of Transaction ID"
            value={paymentData.transactionId}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-300 text-sm font-bold mb-2"
            htmlFor="amount"
          >
            Amount
          </label>
          <input
            className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            name="amount"
            id="amount"
            placeholder="Amount Paid"
            value={paymentData.amount}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <button
            className="w-full bg-jukti-orange hover:bg-jukti-orange-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Record Received Funds
          </button>
        </div>
      </form>
    </div>
  );
};

export default Dashboard;
