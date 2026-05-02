import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    // Persistent sessions using localStorage
    const savedUser = localStorage.getItem('kantin_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const loginAdmin = (username, password) => {
    if (username === 'admin' && password === '12345') {
      const adminUser = { role: 'admin' };
      localStorage.setItem('kantin_user', JSON.stringify(adminUser));
      setUser(adminUser);
      showToast("Admin girişi başarılı.", "success");
      navigate('/admin');
      return true;
    }
    showToast("Hatalı kullanıcı adı veya şifre!", "danger");
    return false;
  };

  const loginStudent = (studentData) => {
    const studentUser = { role: 'student', data: studentData };
    localStorage.setItem('kantin_user', JSON.stringify(studentUser));
    setUser(studentUser);
    showToast(`Hoş geldin, ${studentData.name}!`, "success");
    navigate('/student');
  };

  const logout = () => {
    localStorage.removeItem('kantin_user');
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loginAdmin, loginStudent, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
