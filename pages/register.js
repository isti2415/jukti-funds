import { useState, useEffect } from 'react';
import Layout from '../components/layout';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/router';
import app from './api/firebaseConfig';
import { getDatabase, ref, push, set, get, onValue } from 'firebase/database';

const Register = () => {
  const router = useRouter();
  const auth = getAuth(app);
  const database = getDatabase(app);

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    position: '',
    department: '',
    password: '',
  });

  const [departments, setDepartments] = useState([]);

  const fetchDepartments = async () => {
    try {
      const departmentsRef = ref(database, 'departments');

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
    } catch (error) {
      window.alert('Error fetching departments:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.contact ||
      !formData.email ||
      !formData.password ||
      !formData.position ||
      !formData.department
    ) {
      window.alert('Please fill in all the fields.');
      return;
    }

    try {
      // Check for duplicates based on email, contact, name, position, and department
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      const users = [];
      usersSnapshot.forEach((userSnapshot) => {
        const user = userSnapshot.val();
        users.push(user);
      });

      const isDuplicate = users.some(
        (user) =>
          user.email === formData.email ||
          user.contact === formData.contact ||
          (user.name === formData.name &&
            user.position === formData.position &&
            user.department === formData.department)
      );

      if (isDuplicate) {
        alert('User Already Exists.');
        return;
      }

      // Save the user data in the database
      const newUserRef = push(usersRef);
      const newUserKey = newUserRef.key;
      const newUser = {
        name: formData.name,
        contact: formData.contact,
        email: formData.email,
        position: formData.position,
        department: formData.department,
        isAdmin: false,
      };
      try {
        await set(newUserRef, newUser);

        // Create user authentication
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        if (user) {
          // Registration successful, redirect to the login page
          router.push('/login');
        }
      } catch (error) {
        // Handle database error
        alert('An error occurred while saving user data');
      }
    } catch (error) {
      // Handle database error
      alert('An error occurred while saving user data');
    }
  };


  return (
    <Layout>
      <div className="flex justify-center items-center bg-gray-900">
        <div className="w-full max-w-md">
          <h1 className="text-2xl text-center text-white mb-6">Register for JUKTI Funds</h1>
          <form className="bg-gray-800 shadow-md rounded px-8 pt-4 pb-2">
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                Name
              </label>
              <input
                className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                name="name"
                id="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="contact">
                Contact
              </label>
              <input
                className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                name="contact"
                id="contact"
                placeholder="Your Contact"
                value={formData.contact}
                onChange={handleChange}
                required
              />
            </div>
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
              <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="department">
                Department
              </label>
              <select
                className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                name="department"
                id="department"
                value={formData.department}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.name}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.department !== '' && (
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="position">
                  Position
                </label>
                <select
                  className="appearance-none bg-gray-700 border rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline"
                  name="position"
                  id="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Position</option>
                  {departments.find((department) => department.id === formData.department)?.positions.map((position) => (
                    <option key={position.id} value={position.name}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
            <div className="mb-6">
              <button
                className="bg-jukti-orange hover:bg-jukti-orange-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                onClick={handleSubmit}
              >
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Register;

