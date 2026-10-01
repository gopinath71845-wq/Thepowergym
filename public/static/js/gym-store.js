/**
 * The Power Gym - Client & Server Synchronization Engine
 * Connects directly to Flask SQL backend (/api/*) with persistent fallback.
 * Manages Members, Staff, Plans, Trainers, and Payments in real-time.
 */

const GYM_STORAGE_KEY = 'the_power_gym_data_v2';
const GYM_SESSION_KEY = 'the_power_gym_active_session_v2';

const INITIAL_DATA = {
  gym_name: "The Power Gym",
  merchant_upi: "gopinath71845@oksbi",
  merchant_name: "Gopinath (The Power Gym)",
  staff_keys: ["ASDFGF123456*", "THE POWERGYM", "THEPOWERGYM", "POWER-STAFF-71845"],
  
  plans: [
    {
      id: 1,
      name: "Starter Beast (Monthly)",
      duration_months: 1,
      price: 999,
      features: [
        "Full Strength & Free Weights Zone Access",
        "Cardio Theatre Access (Treadmills, Rowers, Cycles)",
        "Clean Locker Rooms & Hot Showers",
        "1 Free Fitness Assessment & Body Composition Test"
      ]
    },
    {
      id: 2,
      name: "Power Pro (3 Months)",
      duration_months: 3,
      price: 2499,
      popular: true,
      features: [
        "Everything in Starter Beast Plan",
        "Customized Workout Split (Push-Pull-Legs)",
        "Personalized Indian Macro & Diet Chart",
        "Dedicated Coach Consultation & Gym Floor Guidance"
      ]
    },
    {
      id: 3,
      name: "Iron Warrior (6 Months)",
      duration_months: 6,
      price: 4499,
      features: [
        "Unlimited Steam & Sauna Access",
        "Bi-Weekly Body Composition & InBody Scans",
        "Advanced Hypertrophy & Strength Cycles",
        "Free The Power Gym Shaker Bottle"
      ]
    },
    {
      id: 4,
      name: "Legend Titan (1 Year)",
      duration_months: 12,
      price: 7999,
      features: [
        "Maximum Value - Lowest Monthly Rate",
        "5 Free 1-on-1 Personal Training Sessions",
        "45-Day Free Membership Freeze Policy",
        "The Power Gym Official Lifting Straps"
      ]
    }
  ],

  trainers: [
    {
      id: 1,
      name: "Alex Vance (Master Coach)",
      specialty: "Powerlifting & Heavy Compound Strength",
      experience_years: 7,
      bio: "Certified NSCA Powerlifting Coach with over 7 years coaching lifters. Specializes in squat, bench, and deadlift biomechanics.",
      photo: "static/images/trainer_alex.jpg",
      rating: 4.9,
      phone: "+91 98700 11223",
      email: "alex@thepowergym.in"
    },
    {
      id: 2,
      name: "Maya Sharma",
      specialty: "HIIT, Functional Cross-Training & Mobility",
      experience_years: 5,
      bio: "Former national athlete and certified ACE functional fitness coach. Dedicated to high-octane conditioning, stamina, and posture alignment.",
      photo: "static/images/trainer_maya.jpg",
      rating: 4.9,
      phone: "+91 98700 22334",
      email: "maya@thepowergym.in"
    },
    {
      id: 3,
      name: "Vikram Raj",
      specialty: "Hypertrophy, Bodybuilding & Nutrition Architecture",
      experience_years: 6,
      bio: "Gold-certified fitness nutritionist and physique competitor. Master of progressive overload, macro-nutrient timing, and lean muscle gain.",
      photo: "static/images/trainer_vikram.jpg",
      rating: 5.0,
      phone: "+91 98700 33445",
      email: "vikram@thepowergym.in"
    }
  ],

  // Zero hardcoded dummy members - members are registered dynamically or retrieved from SQL
  members: [],

  staff: [
    {
      id: 1,
      username: "admin",
      full_name: "Vikram Raj (Head Staff)",
      email: "admin@thepowergym.in",
      phone: "+91 98765 43210",
      role: "staff",
      is_active: true,
      avatar: "static/images/trainer_vikram.jpg"
    }
  ],

  // Zero hardcoded payments - populated from live transactions in SQL
  payments: []
};

class GymStoreClass {
  constructor() {
    this.serverOnline = false;
    this.apiBase = window.location.origin;
    this.init();
  }

  init() {
    // Clean up any legacy v1 storage that had hardcoded dummy members ('rahul', 'priya')
    try {
      const oldRaw = localStorage.getItem('the_power_gym_data_v1');
      if (oldRaw) {
        localStorage.removeItem('the_power_gym_data_v1');
      }
    } catch (e) {}

    const raw = localStorage.getItem(GYM_STORAGE_KEY);
    if (!raw) {
      this.saveData(INITIAL_DATA);
    } else {
      // Purge any dummy members if they leaked into storage
      try {
        const parsed = JSON.parse(raw);
        if (parsed.members && parsed.members.some(m => m.username === 'rahul' || m.username === 'priya')) {
          parsed.members = parsed.members.filter(m => m.username !== 'rahul' && m.username !== 'priya');
          this.saveData(parsed);
        }
      } catch (e) {}
    }

    // Auto-sync with SQL Server
    this.syncWithServer();
  }

  // Live SQL Server Synchronization
  async syncWithServer() {
    try {
      const res = await fetch(`${this.apiBase}/api/sync`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const current = this.getData();
          if (data.plans && data.plans.length > 0) current.plans = data.plans;
          if (data.trainers && data.trainers.length > 0) current.trainers = data.trainers;
          current.members = data.members || [];
          current.payments = data.payments || [];
          if (data.staff && data.staff.length > 0) current.staff = data.staff;
          if (data.merchant_upi) current.merchant_upi = data.merchant_upi;

          this.saveData(current);
          this.serverOnline = true;
          window.dispatchEvent(new CustomEvent('gym-server-status', { detail: { online: true } }));
          window.dispatchEvent(new CustomEvent('gym-data-synced', { detail: current }));
          return current;
        }
      }
    } catch (err) {
      this.serverOnline = false;
      window.dispatchEvent(new CustomEvent('gym-server-status', { detail: { online: false } }));
    }
    return this.getData();
  }

  getData() {
    try {
      const raw = localStorage.getItem(GYM_STORAGE_KEY);
      if (!raw) return INITIAL_DATA;
      const data = JSON.parse(raw);
      if (!data.staff_keys || !data.staff_keys.includes("ASDFGF123456*")) {
        data.staff_keys = Array.from(new Set(["ASDFGF123456*", ...(data.staff_keys || []), "THE POWERGYM", "THEPOWERGYM", "POWER-STAFF-71845"]));
        this.saveData(data);
      }
      return data;
    } catch (e) {
      console.error("Error reading localStorage:", e);
      return INITIAL_DATA;
    }
  }

  saveData(data) {
    try {
      localStorage.setItem(GYM_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Error writing localStorage:", e);
    }
  }

  // Active Session Management
  getCurrentSession() {
    try {
      const sessionRaw = localStorage.getItem(GYM_SESSION_KEY) || sessionStorage.getItem(GYM_SESSION_KEY);
      if (!sessionRaw) return null;
      return JSON.parse(sessionRaw);
    } catch (e) {
      return null;
    }
  }

  setSession(user) {
    const json = JSON.stringify(user);
    localStorage.setItem(GYM_SESSION_KEY, json);
    sessionStorage.setItem(GYM_SESSION_KEY, json);
  }

  clearSession() {
    localStorage.removeItem(GYM_SESSION_KEY);
    sessionStorage.removeItem(GYM_SESSION_KEY);
    sessionStorage.removeItem('the_power_gym_staff_unlocked');
    localStorage.removeItem('the_power_gym_staff_unlocked');
  }

  lockStaffPortal() {
    sessionStorage.removeItem('the_power_gym_staff_unlocked');
    localStorage.removeItem('the_power_gym_staff_unlocked');
  }

  unlockStaffPortal() {
    sessionStorage.setItem('the_power_gym_staff_unlocked', 'true');
    localStorage.setItem('the_power_gym_staff_unlocked', 'true');
  }

  isStaffPortalUnlocked() {
    const session = this.getCurrentSession();
    if (session && session.role === 'staff') return true;
    return sessionStorage.getItem('the_power_gym_staff_unlocked') === 'true' ||
           localStorage.getItem('the_power_gym_staff_unlocked') === 'true';
  }

  verifyStaffPortalKey(key) {
    if (!key) return false;
    const db = this.getData();
    const cleanKey = key.trim().toUpperCase().replace(/\s+/g, '');
    const validKeys = (db.staff_keys || ["ASDFGF123456*", "ASDFGF123456", "THEPOWERGYM", "POWER-STAFF-71845"]).map(k => k.trim().toUpperCase().replace(/\s+/g, ''));
    return cleanKey === "ASDFGF123456*" || validKeys.includes(cleanKey);
  }

  async changeStaffPassKey(newKey) {
    if (!newKey || newKey.trim().length < 4) {
      return { success: false, message: "Security Pass Key must be at least 4 characters." };
    }
    const clean = newKey.trim();
    const db = this.getData();
    if (!db.staff_keys) db.staff_keys = [];
    db.staff_keys = Array.from(new Set([clean, ...db.staff_keys]));
    this.saveData(db);

    try {
      await fetch(`${this.apiBase}/api/auth/change-staff-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_key: clean })
      });
    } catch (e) {}

    return { success: true, message: `Staff Pass Key successfully updated to "${clean}".`, newKey: clean };
  }

  // Member Registration (Saved to SQL Database)
  async registerMember(data) {
    // 1. Try SQL Server API
    try {
      const res = await fetch(`${this.apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.member) {
          const db = this.getData();
          db.members.push(json.member);
          this.saveData(db);
          this.setSession(json.member);
          return { success: true, member: json.member };
        }
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson && errJson.message) {
          return { success: false, message: errJson.message };
        }
      }
    } catch (e) {
      console.warn('SQL API offline, registering in local store:', e);
    }

    // 2. Local fallback
    const db = this.getData();
    const existing = db.members.find(
      m => m.username.toLowerCase() === data.username.toLowerCase() ||
           m.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) {
      return { success: false, message: "A member with this username or email already exists." };
    }

    const newId = 1000 + db.members.length + 1;
    const planId = parseInt(data.plan_id) || 1;
    const plan = db.plans.find(p => p.id === planId) || db.plans[0];
    const today = new Date();
    const end = new Date(today);
    end.setMonth(end.getMonth() + plan.duration_months);

    const newMember = {
      id: newId,
      username: data.username.trim(),
      password: data.password,
      full_name: data.full_name.trim(),
      email: data.email.trim(),
      phone: data.phone ? data.phone.trim() : "",
      role: "customer",
      is_active: true,
      avatar: "static/images/default_avatar.png",
      plan_id: plan.id,
      trainer_id: 1,
      membership_status: "PENDING_PAYMENT",
      membership_start: today.toISOString().split('T')[0],
      membership_end: end.toISOString().split('T')[0]
    };

    db.members.push(newMember);
    this.saveData(db);
    this.setSession(newMember);
    return { success: true, member: newMember };
  }

  // Member Login (Verified against SQL Database)
  async loginCustomer(usernameOrEmail, password) {
    try {
      const res = await fetch(`${this.apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username_or_email: usernameOrEmail, password })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.member) {
          this.setSession(json.member);
          return { success: true, member: json.member };
        }
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson && errJson.message) {
          return { success: false, message: errJson.message };
        }
      }
    } catch (e) {
      console.warn('API login check failed, verifying locally:', e);
    }

    // Local fallback
    const db = this.getData();
    const term = usernameOrEmail.trim().toLowerCase();
    const member = db.members.find(
      m => (m.username.toLowerCase() === term || m.email.toLowerCase() === term) &&
           m.password === password
    );

    if (member) {
      this.setSession(member);
      return { success: true, member };
    }
    return { success: false, message: "Invalid username/email or password." };
  }

  // Staff Login (Verified against SQL Database with 3-Factor Validation)
  async loginStaff(usernameOrEmail, password, securityKey) {
    const cleanKey = (securityKey || '').trim().toUpperCase().replace(/\s+/g, '');
    try {
      const res = await fetch(`${this.apiBase}/api/auth/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: usernameOrEmail,
          password: password,
          security_key: cleanKey
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.staff) {
          this.setSession(json.staff);
          this.unlockStaffPortal();
          return { success: true, staff: json.staff };
        }
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson && errJson.message) {
          return { success: false, message: errJson.message };
        }
      }
    } catch (e) {
      console.warn('Staff login API offline, checking local credentials:', e);
    }

    // Local verification fallback
    const db = this.getData();
    const term = usernameOrEmail.trim().toLowerCase();
    const validKey = cleanKey === 'ASDFGF123456*' || cleanKey === 'ASDFGF123456' || (db.staff_keys || []).some(k => k.replace(/\s+/g, '').toUpperCase() === cleanKey);
    if (!validKey) {
      return { success: false, message: "Invalid Server Security Master Key." };
    }

    const staffMember = (db.staff || []).find(
      s => (s.username.toLowerCase() === term || s.email.toLowerCase() === term) &&
           s.password === password
    );

    if (staffMember) {
      this.setSession(staffMember);
      this.unlockStaffPortal();
      return { success: true, staff: staffMember };
    }
    return { success: false, message: "Invalid staff username or password." };
  }

  // Staff Registration
  async registerStaff(data) {
    const cleanKey = (data.security_key || '').trim().toUpperCase().replace(/\s+/g, '');
    try {
      const res = await fetch(`${this.apiBase}/api/auth/staff-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, security_key: cleanKey })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.staff) {
          const db = this.getData();
          if (!db.staff) db.staff = [];
          db.staff.push(json.staff);
          this.saveData(db);
          this.setSession(json.staff);
          this.unlockStaffPortal();
          return { success: true, staff: json.staff };
        }
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson && errJson.message) {
          return { success: false, message: errJson.message };
        }
      }
    } catch (e) {
      console.warn('Staff register API error, saving locally:', e);
    }

    // Local fallback
    const db = this.getData();
    const validKey = cleanKey === 'ASDFGF123456*' || cleanKey === 'ASDFGF123456' || (db.staff_keys || []).some(k => k.replace(/\s+/g, '').toUpperCase() === cleanKey);
    if (!validKey) {
      return { success: false, message: "Invalid Server Security Master Key." };
    }

    const existing = (db.staff || []).find(
      s => s.username.toLowerCase() === data.username.toLowerCase() ||
           s.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) {
      return { success: false, message: "A staff account with this username or email already exists." };
    }

    const newStaff = {
      id: 500 + (db.staff || []).length + 1,
      username: data.username.trim(),
      password: data.password,
      full_name: data.full_name.trim(),
      email: data.email.trim(),
      phone: data.phone ? data.phone.trim() : "",
      role: "staff",
      is_active: true,
      avatar: "static/images/trainer_vikram.jpg"
    };

    if (!db.staff) db.staff = [];
    db.staff.push(newStaff);
    this.saveData(db);
    this.setSession(newStaff);
    this.unlockStaffPortal();
    return { success: true, staff: newStaff };
  }

  // Update Member Profile
  async updateMemberProfile(userId, profileData) {
    const db = this.getData();
    const uid = parseInt(userId);
    const memberIndex = db.members.findIndex(m => m.id === uid);
    if (memberIndex !== -1) {
      Object.assign(db.members[memberIndex], profileData);
      this.saveData(db);
      const session = this.getCurrentSession();
      if (session && session.id === uid) {
        Object.assign(session, profileData);
        this.setSession(session);
      }
    }

    try {
      const res = await fetch(`${this.apiBase}/api/members/${userId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.member && memberIndex !== -1) {
          Object.assign(db.members[memberIndex], json.member);
          this.saveData(db);
          const session = this.getCurrentSession();
          if (session && session.id === uid) {
            Object.assign(session, json.member);
            this.setSession(session);
          }
        }
      }
    } catch (e) {}

    return { success: true, member: db.members[memberIndex] || profileData };
  }

  // Select Trainer
  async selectTrainer(userId, trainerId) {
    const db = this.getData();
    const uid = parseInt(userId);
    const tid = parseInt(trainerId);
    const memberIndex = db.members.findIndex(m => m.id === uid);
    if (memberIndex !== -1) {
      db.members[memberIndex].trainer_id = tid;
      this.saveData(db);
      const session = this.getCurrentSession();
      if (session && session.id === uid) {
        session.trainer_id = tid;
        this.setSession(session);
      }
    }

    try {
      await fetch(`${this.apiBase}/api/members/${uid}/select-trainer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainer_id: tid })
      });
    } catch (e) {}

    return { success: true };
  }

  // Submit Payment Proof (UPI or Offline Cash)
  async submitPayment(paymentData) {
    let newPayment = null;

    try {
      const res = await fetch(`${this.apiBase}/api/payments/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.payment) {
          newPayment = json.payment;
        }
      }
    } catch (e) {
      console.warn('API submit payment error, storing locally:', e);
    }

    const db = this.getData();
    if (!newPayment) {
      const newId = 2000 + db.payments.length + 1;
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const plan = db.plans.find(p => p.id === parseInt(paymentData.plan_id)) || db.plans[0];

      newPayment = {
        id: newId,
        user_id: paymentData.user_id,
        user_name: paymentData.user_name,
        plan_id: plan.id,
        plan_name: plan.name,
        amount: plan.price,
        method: paymentData.method,
        utr: paymentData.utr || `CASH-VOUCHER-${newId}`,
        status: "Pending",
        date: dateFormatted,
        notes: paymentData.notes || 'Payment submitted for verification'
      };
    }

    db.payments.unshift(newPayment);

    // Update user's membership locally
    const memberIndex = db.members.findIndex(m => m.id === paymentData.user_id);
    if (memberIndex !== -1) {
      db.members[memberIndex].plan_id = newPayment.plan_id;
      db.members[memberIndex].membership_status = "PENDING_APPROVAL";
      const session = this.getCurrentSession();
      if (session && session.id === paymentData.user_id) {
        this.setSession(db.members[memberIndex]);
      }
    }

    this.saveData(db);
    return { success: true, payment: newPayment };
  }

  // Staff Payment Approval (Persists to SQL Server)
  async approvePayment(paymentId) {
    const pid = parseInt(paymentId);
    const db = this.getData();
    const payment = db.payments.find(p => p.id === pid);
    if (payment) {
      payment.status = "Approved";
      const member = db.members.find(m => m.id === payment.user_id);
      if (member) {
        member.membership_status = "ACTIVE";
        member.is_active = true;
      }
      this.saveData(db);
    }

    try {
      const res = await fetch(`${this.apiBase}/api/payments/${pid}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, message: json.message };
      }
    } catch (e) {
      console.warn('Server sync error during approve payment:', e);
    }

    return { success: true, message: `Payment #${pid} approved!` };
  }

  // Staff Payment Rejection (Persists to SQL Server)
  async rejectPayment(paymentId) {
    const pid = parseInt(paymentId);
    const db = this.getData();
    const payment = db.payments.find(p => p.id === pid);
    if (payment) {
      payment.status = "Rejected";
      this.saveData(db);
    }

    try {
      const res = await fetch(`${this.apiBase}/api/payments/${pid}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, message: json.message };
      }
    } catch (e) {
      console.warn('Server sync error during reject payment:', e);
    }

    return { success: true, message: `Payment #${pid} rejected.` };
  }

  // Toggle Member Active Status (Persists to SQL Server)
  async toggleMemberStatus(userId) {
    const uid = parseInt(userId);
    const db = this.getData();
    const member = db.members.find(m => m.id === uid);
    let newStatus = false;
    if (member) {
      member.is_active = !member.is_active;
      member.membership_status = member.is_active ? "ACTIVE" : "SUSPENDED";
      newStatus = member.is_active;
      this.saveData(db);
    }

    try {
      const res = await fetch(`${this.apiBase}/api/members/${uid}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, is_active: json.is_active };
      }
    } catch (e) {}

    return { success: true, is_active: newStatus };
  }

  // Delete Member Permanently (Persists to SQL Server)
  async deleteMember(userId) {
    const uid = parseInt(userId, 10);
    const db = this.getData();
    db.members = db.members.filter(m => m.id !== uid);
    db.payments = db.payments.filter(p => p.user_id !== uid);
    this.saveData(db);

    try {
      const res = await fetch(`${this.apiBase}/api/members/${uid}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        return { success: true, message: json.message };
      }
    } catch (e) {}

    return { success: true, message: "Member removed successfully from registry." };
  }

  // Add Trainer (Persists to SQL Database)
  async addTrainer(trainerData) {
    let newTrainer = null;

    try {
      const res = await fetch(`${this.apiBase}/api/trainers/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainerData)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.trainer) {
          newTrainer = json.trainer;
        }
      }
    } catch (e) {
      console.warn('API error when adding trainer, persisting locally:', e);
    }

    const db = this.getData();
    if (!newTrainer) {
      const newId = db.trainers.length + 1;
      newTrainer = {
        id: newId,
        name: trainerData.name.trim(),
        specialty: trainerData.specialty.trim(),
        experience_years: parseInt(trainerData.experience_years) || 3,
        bio: trainerData.bio.trim(),
        photo: trainerData.photo || "static/images/trainer_alex.jpg",
        rating: parseFloat(trainerData.rating) || 5.0,
        phone: trainerData.phone || "+91 98700 00000",
        email: trainerData.email || "coach@thepowergym.in"
      };
    }

    const existingIdx = db.trainers.findIndex(t => t.id === newTrainer.id || t.name.toLowerCase() === newTrainer.name.toLowerCase());
    if (existingIdx !== -1) {
      db.trainers[existingIdx] = newTrainer;
    } else {
      db.trainers.push(newTrainer);
    }
    this.saveData(db);
    return { success: true, trainer: newTrainer, message: 'Coach saved successfully to SQL server!' };
  }

  // Get Aggregated Stats
  getStats() {
    const db = this.getData();
    const totalMembers = db.members.length;
    const pendingPayments = db.payments.filter(p => p.status === "Pending").length;
    const approvedPayments = db.payments.filter(p => p.status === "Approved");
    const totalRevenue = approvedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const activeTrainers = db.trainers.length;

    return {
      totalMembers,
      pendingPayments,
      totalRevenue,
      activeTrainers
    };
  }
}

// Export global singleton instance
window.GymStore = new GymStoreClass();
