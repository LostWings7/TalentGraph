import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TalentAPI } from '../api/client';

const TalentContext = createContext(null);

export const TalentProvider = ({ children }) => {
  // 1. Real Authentication & User Identity State
  const [authToken, setAuthTokenState] = useState(() => {
    return localStorage.getItem('tg_auth_token') || null;
  });

  const [currentUser, setCurrentUserState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tg_auth_user')) || null;
    } catch {
      return null;
    }
  });

  const [currentEnterprise, setCurrentEnterprise] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tg_current_enterprise')) || {
        id: 1,
        name: 'NovaTech Solutions',
        slug: 'novatech-solutions',
        industry: 'Enterprise Software & Cloud AI',
        departments: ['Engineering', 'AI Research', 'Data Platform', 'Cloud Architecture', 'Product', 'Security']
      };
    } catch {
      return null;
    }
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('tg_user_role') || (currentUser?.role || 'employee');
  });

  const [isMustChangePasswordOpen, setIsMustChangePasswordOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  // 2. Employee & Persona Context
  const [employees, setEmployees] = useState([]);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [employeeDetail, setEmployeeDetail] = useState(null);
  const [activeRoleMatches, setActiveRoleMatches] = useState([]);
  
  const [selectedTargetRoleId, setSelectedTargetRoleIdState] = useState(() => {
    const saved = localStorage.getItem('tg_target_role_id');
    return saved ? Number(saved) : null;
  });

  // 3. Active Tab & Navigation History
  const [activeTab, setActiveTabState] = useState(() => {
    const token = localStorage.getItem('tg_auth_token');
    const saved = localStorage.getItem('tg_active_tab');
    if (!token) return 'login';
    return saved || 'dashboard';
  });
  const [navHistory, setNavHistory] = useState(['login']);

  // 4. Modals, Drawers & Onboarding
  const [onboardingCompleted, setOnboardingCompletedState] = useState(() => {
    return localStorage.getItem('tg_onboarding_completed') === 'true';
  });
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // 5. Dual Theme State
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('tg_theme') || 'dark';
  });

  // 6. Recently Viewed Items
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tg_recent_items')) || [];
    } catch {
      return [];
    }
  });

  // 7. AI & Global System State
  const [aiStatus, setAiStatus] = useState({
    gemini_model: 'gemini-3.7-flash',
    has_api_key: false,
    mode: 'Checking Gemini Engine...',
  });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Sync theme with document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('tg_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = useCallback((message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification((prev) => (prev?.id === prev?.id ? null : prev));
    }, 4000);
  }, []);

  // Authentication Actions
  const login = async (email, password) => {
    try {
      const res = await TalentAPI.login({ email, password });
      const { token, user, enterprise } = res.data;

      localStorage.setItem('tg_auth_token', token);
      localStorage.setItem('tg_auth_user', JSON.stringify(user));
      localStorage.setItem('tg_user_role', user.role);
      if (enterprise) {
        localStorage.setItem('tg_current_enterprise', JSON.stringify(enterprise));
        setCurrentEnterprise(enterprise);
      }

      setAuthTokenState(token);
      setCurrentUserState(user);
      setUserRole(user.role);

      // If user has temporary password, prompt them
      if (user.is_temporary_password) {
        setIsMustChangePasswordOpen(true);
      }

      // Route according to role
      if (user.role === 'hr_admin') {
        navigateTo('hr');
      } else {
        // Find employee object
        if (user.employee_id) {
          localStorage.setItem('tg_active_emp_id', String(user.employee_id));
        }
        navigateTo('dashboard');
      }

      showToast(`Welcome back, ${user.name}! Connected to ${enterprise?.name || 'NovaTech Solutions'}.`, 'success');
      return res.data;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      if (authToken) {
        await TalentAPI.logout().catch(() => {});
      }
    } finally {
      localStorage.removeItem('tg_auth_token');
      localStorage.removeItem('tg_auth_user');
      localStorage.removeItem('tg_user_role');
      localStorage.removeItem('tg_active_emp_id');
      localStorage.removeItem('tg_active_tab');
      setAuthTokenState(null);
      setCurrentUserState(null);
      setUserRole('employee');
      setEmployees([]);
      setActiveEmployee(null);
      setEmployeeDetail(null);
      setActiveRoleMatches([]);
      navigateTo('login');
      showToast('You have been signed out.', 'info');
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    const res = await TalentAPI.changePassword({
      old_password: oldPassword,
      new_password: newPassword,
    });
    if (currentUser) {
      const updated = { ...currentUser, is_temporary_password: false };
      setCurrentUserState(updated);
      localStorage.setItem('tg_auth_user', JSON.stringify(updated));
    }
    setIsMustChangePasswordOpen(false);
    return res.data;
  };

  const refreshPendingApprovals = async () => {
    if (userRole === 'hr_admin') {
      try {
        const res = await TalentAPI.getApprovals({ status: 'pending' });
        setPendingApprovalsCount(res.data.pending_count || (res.data.results ? res.data.results.length : 0));
      } catch (err) {
        // ignore if not authorized
      }
    }
  };

  const setOnboardingCompleted = (val) => {
    setOnboardingCompletedState(val);
    localStorage.setItem('tg_onboarding_completed', String(val));
  };

  const setSelectedTargetRoleId = (roleId) => {
    setSelectedTargetRoleIdState(roleId);
    if (roleId) {
      localStorage.setItem('tg_target_role_id', String(roleId));
    }
  };

  const addRecentItem = (item) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((r) => r.id !== item.id && r.title !== item.title);
      const updated = [item, ...filtered].slice(0, 6);
      localStorage.setItem('tg_recent_items', JSON.stringify(updated));
      return updated;
    });
  };

  // Scroll Position Management
  const saveCurrentScroll = (tabName) => {
    if (typeof window !== 'undefined') {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      sessionStorage.setItem(`tg_scroll_${tabName}`, String(scrollY));
    }
  };

  const restoreScroll = (tabName) => {
    if (typeof window !== 'undefined') {
      const savedScroll = sessionStorage.getItem(`tg_scroll_${tabName}`);
      if (savedScroll !== null) {
        setTimeout(() => {
          window.scrollTo({
            top: Number(savedScroll),
            behavior: 'instant'
          });
        }, 30);
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  };

  const navigateTo = (tabName, context = {}) => {
    saveCurrentScroll(activeTab);

    if (context.targetRoleId) {
      setSelectedTargetRoleId(context.targetRoleId);
    }

    if (context.recentItem) {
      addRecentItem(context.recentItem);
    }

    setNavHistory((prev) => [...prev, activeTab]);
    setActiveTabState(tabName);
    localStorage.setItem('tg_active_tab', tabName);
    restoreScroll(tabName);
  };

  const goBack = () => {
    if (navHistory.length > 0) {
      const prevTab = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setActiveTabState(prevTab);
      localStorage.setItem('tg_active_tab', prevTab);
      restoreScroll(prevTab);
    } else {
      navigateTo(userRole === 'hr_admin' ? 'hr' : 'dashboard');
    }
  };

  // Switch Active Employee Persona
  const switchEmployee = async (empId) => {
    const target = employees.find((e) => e.id === Number(empId));
    if (!target) return;

    setActiveEmployee(target);
    localStorage.setItem('tg_active_emp_id', String(empId));
    
    try {
      const [detailRes, matchesRes] = await Promise.all([
        TalentAPI.getEmployeeDetail(empId),
        TalentAPI.getRankedRoleMatches(empId)
      ]);
      setEmployeeDetail(detailRes.data);
      const matches = matchesRes.data.results || matchesRes.data || [];
      setActiveRoleMatches(matches);

      if (detailRes.data?.career_goal?.target_role_id) {
        setSelectedTargetRoleId(detailRes.data.career_goal.target_role_id);
      } else if (matches.length > 0) {
        setSelectedTargetRoleId(matches[0].role_id);
      }
    } catch (err) {
      console.error('Error switching employee:', err);
    }
  };

  const refreshEmployees = async () => {
    try {
      const empRes = await TalentAPI.getEmployees();
      const empList = empRes.data.results || empRes.data || [];
      setEmployees(empList);
      return empList;
    } catch (err) {
      console.error('Error refreshing employees list:', err);
    }
  };

  const refreshActiveEmployee = async () => {
    if (!activeEmployee?.id) return;
    try {
      const [detailRes, matchesRes] = await Promise.all([
        TalentAPI.getEmployeeDetail(activeEmployee.id),
        TalentAPI.getRankedRoleMatches(activeEmployee.id)
      ]);
      setEmployeeDetail(detailRes.data);
      setActiveRoleMatches(matchesRes.data.results || matchesRes.data || []);
    } catch (err) {
      console.error('Error refreshing active employee detail:', err);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsGuideOpen((prev) => !prev);
        return;
      }

      const now = Date.now();
      const key = e.key.toLowerCase();

      if (lastKey === 'g' && now - lastKeyTime < 1000) {
        if (key === 'd') {
          e.preventDefault();
          navigateTo('dashboard');
        } else if (key === 's') {
          e.preventDefault();
          navigateTo('profile');
        } else if (key === 'r') {
          e.preventDefault();
          navigateTo('roles');
        } else if (key === 'm') {
          e.preventDefault();
          navigateTo('match');
        } else if (key === 'g') {
          e.preventDefault();
          navigateTo('gap');
        } else if (key === 'c') {
          e.preventDefault();
          navigateTo('roadmap');
        } else if (key === 'a') {
          e.preventDefault();
          navigateTo('assistant');
        } else if (key === 'h') {
          e.preventDefault();
          navigateTo('hr');
        } else if (key === 'p') {
          e.preventDefault();
          navigateTo('studio');
        } else if (key === 't') {
          e.preventDefault();
          navigateTo('staffing');
        } else if (key === 'v') {
          e.preventDefault();
          navigateTo('approvals');
        }
        lastKey = '';
        return;
      }

      if (key === 'g') {
        lastKey = 'g';
        lastKeyTime = now;
      } else {
        lastKey = '';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Initial Data Bootstrap
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);

        // Fetch AI Status (public)
        const aiRes = await TalentAPI.getAIStatus().catch(() => ({ 
          data: { gemini_model: 'gemini-3.7-flash', has_api_key: false, mode: 'Deterministic Fallback' } 
        }));
        if (aiRes.data) {
          setAiStatus(aiRes.data);
        }

        // If no auth token, reset authenticated state and exit early
        if (!authToken) {
          setEmployees([]);
          setActiveEmployee(null);
          setEmployeeDetail(null);
          setActiveRoleMatches([]);
          return;
        }

        // Check if token exists, verify with me endpoint
        let verifiedUser = currentUser;
        try {
          const meRes = await TalentAPI.getMe();
          verifiedUser = meRes.data.user;
          setCurrentUserState(verifiedUser);
          setUserRole(verifiedUser.role);
          if (meRes.data.enterprise) {
            setCurrentEnterprise(meRes.data.enterprise);
          }
          if (verifiedUser.is_temporary_password) {
            setIsMustChangePasswordOpen(true);
          }
        } catch (meErr) {
          // Token expired or invalid — clear auth and redirect to login
          const isAuthError = meErr?.response?.status === 401 || meErr?.response?.status === 403 || meErr?.response?.status === 404;
          if (isAuthError) {
            console.warn('Session token invalid, redirecting to login:', meErr);
            localStorage.removeItem('tg_auth_token');
            localStorage.removeItem('tg_auth_user');
            localStorage.removeItem('tg_user_role');
            localStorage.removeItem('tg_active_emp_id');
            setAuthTokenState(null);
            setCurrentUserState(null);
            setUserRole('employee');
            setEmployees([]);
            setActiveEmployee(null);
            setEmployeeDetail(null);
            setActiveRoleMatches([]);
            setActiveTabState('login');
            localStorage.setItem('tg_active_tab', 'login');
            return;
          } else {
            console.error('Network or server error verifying token:', meErr);
            // On a network error, we don't log them out, just show a toast or continue using cached data.
            showToast('Unable to connect to server. Retrying...', 'error');
            setLoading(false);
            return;
          }
        }

        const empRes = await TalentAPI.getEmployees().catch(() => ({ data: [] }));
        const empList = empRes.data.results || empRes.data || [];
        setEmployees(empList);

        // Determine active employee
        let targetEmp = null;
        if (verifiedUser?.role === 'employee' && verifiedUser?.employee_id) {
          targetEmp = empList.find((e) => e.id === verifiedUser.employee_id);
        }
        if (!targetEmp) {
          const savedEmpId = localStorage.getItem('tg_active_emp_id');
          targetEmp = savedEmpId ? empList.find((e) => e.id === Number(savedEmpId)) : null;
        }
        if (!targetEmp && empList.length > 0) {
          targetEmp = empList[0];
        }

        if (targetEmp) {
          setActiveEmployee(targetEmp);
          localStorage.setItem('tg_active_emp_id', String(targetEmp.id));
        }

        // Fetch pending approvals count if HR
        if (verifiedUser?.role === 'hr_admin') {
          TalentAPI.getApprovals({ status: 'pending' })
            .then(res => setPendingApprovalsCount(res.data.pending_count || 0))
            .catch(() => {});
        }
      } catch (err) {
        console.error('Failed to initialize TalentGraph data:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [authToken]);

  // Sync detailed profile when activeEmployee changes
  useEffect(() => {
    if (!authToken || !activeEmployee?.id) {
      setEmployeeDetail(null);
      setActiveRoleMatches([]);
      return;
    }

    const fetchDetail = async () => {
      try {
        const [detailRes, matchesRes] = await Promise.all([
          TalentAPI.getEmployeeDetail(activeEmployee.id).catch((err) => {
            console.warn('Could not fetch detail for employee:', activeEmployee.id, err);
            if (err?.response?.status === 404 || err?.response?.status === 401 || err?.response?.status === 403) {
              localStorage.removeItem('tg_active_emp_id');
              setActiveEmployee(null);
            }
            return null;
          }),
          TalentAPI.getRankedRoleMatches(activeEmployee.id).catch((err) => {
            console.warn('Could not fetch matches for employee:', activeEmployee.id, err);
            return null;
          })
        ]);
        if (detailRes?.data) setEmployeeDetail(detailRes.data);
        if (matchesRes?.data) {
          const matches = matchesRes.data.results || matchesRes.data || [];
          setActiveRoleMatches(matches);
          
          // Verify if currently selectedTargetRoleId is in the matches
          const matchIds = matches.map(m => m.role_id || m.id);
          if (matches.length > 0 && (!selectedTargetRoleId || !matchIds.includes(selectedTargetRoleId))) {
            const defaultTarget = detailRes?.data?.career_goal?.target_role_id && matchIds.includes(detailRes.data.career_goal.target_role_id)
              ? detailRes.data.career_goal.target_role_id
              : matches[0].role_id;
            setSelectedTargetRoleId(defaultTarget);
          }
        }
      } catch (err) {
        console.error('Error fetching employee detailed profile:', err);
      }
    };

    fetchDetail();
  }, [activeEmployee?.id, authToken]);

  return (
    <TalentContext.Provider
      value={{
        authToken,
        currentUser,
        userRole,
        currentEnterprise,
        login,
        logout,
        changePassword,
        isMustChangePasswordOpen,
        setIsMustChangePasswordOpen,
        isChangePasswordModalOpen,
        setIsChangePasswordModalOpen,
        pendingApprovalsCount,
        refreshPendingApprovals,
        employees,
        activeEmployee,
        setActiveEmployee,
        employeeDetail,
        setEmployeeDetail,
        activeRoleMatches,
        selectedTargetRoleId,
        setSelectedTargetRoleId,
        activeTab,
        setActiveTab: setActiveTabState,
        navigateTo,
        goBack,
        navHistory,
        onboardingCompleted,
        setOnboardingCompleted,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isGuideOpen,
        setIsGuideOpen,
        isPersonaModalOpen,
        setIsPersonaModalOpen,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        theme,
        toggleTheme,
        recentlyViewed,
        addRecentItem,
        switchEmployee,
        refreshActiveEmployee,
        refreshEmployees,
        aiStatus,
        loading,
        notification,
        showToast,
      }}
    >
      {children}
    </TalentContext.Provider>
  );
};

export const useTalent = () => {
  const context = useContext(TalentContext);
  if (!context) {
    throw new Error('useTalent must be used within a TalentProvider');
  }
  return context;
};
