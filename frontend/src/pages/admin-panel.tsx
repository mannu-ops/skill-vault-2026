import { useState, useEffect, useMemo } from 'react';
import { getApiUrl } from '../config';
import { toast } from 'sonner';
import {
  DollarSign,
  ShoppingBag,
  Users,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ArrowLeft,
  X,
  RefreshCw,
  Clock,
  Lock,
  LogOut,
  KeyRound,
  UserCheck,
  AlertTriangle,
  Loader2,
  Upload,
  Sparkles,
  Link,
  ShieldAlert,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useLocation } from 'wouter';

interface AdminStats {
  totalRevenueInr: number;
  totalPurchases: number;
  totalUsers: number;
  totalCourses: number;
}

interface CourseItem {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category: string;
  priceInr: number;
  originalPriceInr: number;
  isPublished: boolean;
  driveUrl?: string | null;
  imageUrl?: string | null;
  razorpayPaymentUrl?: string | null;
  duration?: string | null;
  features?: string[] | null;
  bonus?: string | null;
  modules?: any[] | null;
  testimonials?: any[] | null;
  faqs?: any[] | null;
  createdAt?: string;
}

interface PurchaseItem {
  id: string;
  userEmail: string;
  userName?: string | null;
  userPhone?: string | null;
  courseId: string;
  amountPaidInr: number;
  paymentId?: string | null;
  status: string;
  accessDelivered: boolean;
  createdAt: string;
}

const CATEGORIES = [
  'All Products',
  'Course',
  'Software',
  'Architecture & Design',
  'Game',
  'Notes',
  'Hacks',
  'Blog'
];

function AdminPagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-800 bg-[#0d0f19] text-xs font-medium text-slate-400">
      <div>
        Showing <span className="font-bold text-slate-200">{startItem}</span> to <span className="font-bold text-slate-200">{endItem}</span> of <span className="font-bold text-slate-200">{totalItems}</span> entries
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            className={`px-3 py-1.5 rounded-lg border font-mono transition-colors cursor-pointer ${
              currentPage === pageNum
                ? 'bg-violet-600 border-violet-500 text-white font-bold shadow-md shadow-violet-600/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminPanelPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string>(() => localStorage.getItem('sv_admin_token') || '');

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'buyers' | 'users' | 'bonus'>('products');

  // Bonus Offer Manager State (Supports up to 3 multiple bonus offers)
  const [bonuses, setBonuses] = useState<Array<{
    id: string;
    enabled: boolean;
    title: string;
    price: string;
    originalPrice: string;
    category: string;
    description: string;
    selectedProductId?: string;
    imageUrl?: string;
    driveUrl?: string;
  }>>([
    {
      id: 'bonus-vip-toolkit',
      enabled: true,
      title: 'Add VIP Developer Toolkit & Cheat-Sheets',
      price: '149',
      originalPrice: '999',
      category: 'Software & Tools',
      description: 'Unlock 50+ scripts, cheat-sheets & tools for just ₹149 extra.',
      selectedProductId: ''
    }
  ]);
  const [savingBonus, setSavingBonus] = useState(false);
  const [bonusSuccessMsg, setBonusSuccessMsg] = useState('');
  const [stats, setStats] = useState<AdminStats>({
    totalRevenueInr: 0,
    totalPurchases: 0,
    totalUsers: 0,
    totalCourses: 0
  });

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Custom Theme Session Revocation / Access Restore Modal State
  const [accessConfirmModal, setAccessConfirmModal] = useState<{
    isOpen: boolean;
    user: { id: string; name: string; email: string; isDisabled: boolean } | null;
  }>({ isOpen: false, user: null });

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [courseSearch, setCourseSearch] = useState('');
  const [buyerSearch, setBuyerSearch] = useState('');
  const [buyerFilterType, setBuyerFilterType] = useState<'all' | 'guest' | 'registered'>('all');
  const [buyerDatePreset, setBuyerDatePreset] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'custom'>('all');
  const [buyerStartDate, setBuyerStartDate] = useState('');
  const [buyerEndDate, setBuyerEndDate] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const resetBuyerDateFilter = () => {
    setBuyerDatePreset('all');
    setBuyerStartDate('');
    setBuyerEndDate('');
  };

  // Pagination State
  const [coursesPage, setCoursesPage] = useState(1);
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<CourseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userNameForm, setUserNameForm] = useState('');
  const [userEmailForm, setUserEmailForm] = useState('');
  const [userPhoneForm, setUserPhoneForm] = useState('');
  const [userPasswordForm, setUserPasswordForm] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // Edit Purchase Modal State
  const [editingPurchase, setEditingPurchase] = useState<PurchaseItem | null>(null);
  const [purchaseAccessDeliveredForm, setPurchaseAccessDeliveredForm] = useState(true);
  const [purchaseAmountForm, setPurchaseAmountForm] = useState('0');
  const [purchasePaymentIdForm, setPurchasePaymentIdForm] = useState('');
  const [savingPurchase, setSavingPurchase] = useState(false);

  // Add Manual Purchase Modal State
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [addPurchaseEmail, setAddPurchaseEmail] = useState('');
  const [addPurchaseName, setAddPurchaseName] = useState('');
  const [addPurchasePhone, setAddPurchasePhone] = useState('');
  const [addPurchaseCourseId, setAddPurchaseCourseId] = useState('');
  const [addPurchaseAmount, setAddPurchaseAmount] = useState('299');
  const [addPurchasePaymentId, setAddPurchasePaymentId] = useState('');
  const [addPurchaseAccessDelivered, setAddPurchaseAccessDelivered] = useState(true);
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  // Form State
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Course');
  const [formPrice, setFormPrice] = useState('1999');
  const [formOriginalPrice, setFormOriginalPrice] = useState('4999');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formDriveUrl, setFormDriveUrl] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formRazorpayPaymentUrl, setFormRazorpayPaymentUrl] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formBonus, setFormBonus] = useState('');
  const [formModules, setFormModules] = useState('');
  const [formTestimonials, setFormTestimonials] = useState('');
  const [formFaqs, setFormFaqs] = useState('');
  const [formInstallationProcess, setFormInstallationProcess] = useState('');
  const [formGalleryImages, setFormGalleryImages] = useState('');
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'access' | 'software' | 'content'>('basic');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Helper to upload image directly to ImageKit (bypassing server proxy / 413 limits) with server fallback
  const uploadImageFile = async (file: File, folder: string = '/products'): Promise<string> => {
    // 1. Try Direct Upload to ImageKit via Authentication Endpoint
    try {
      const authRes = await fetch(getApiUrl('/api/admin/imagekit-auth'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.publicKey && authData.signature && authData.token) {
          const ikFormData = new FormData();
          ikFormData.append('file', file);
          ikFormData.append('fileName', file.name);
          ikFormData.append('publicKey', authData.publicKey);
          ikFormData.append('signature', authData.signature);
          ikFormData.append('expire', authData.expire);
          ikFormData.append('token', authData.token);
          ikFormData.append('folder', folder);
          ikFormData.append('useUniqueFileName', 'true');

          const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            body: ikFormData
          });
          const ikData = await ikRes.json().catch(() => ({}));
          if (ikRes.ok && (ikData.url || ikData.filePath)) {
            const urlEndpoint = (authData.urlEndpoint || 'https://ik.imagekit.io/e1wrzy1j2').replace(/\/$/, '');
            const filePath = (ikData.filePath || '').startsWith('/') ? ikData.filePath : `/${ikData.filePath || ''}`;
            return ikData.url || `${urlEndpoint}${filePath}`;
          }
        }
      }
    } catch (directErr) {
      console.warn('Direct ImageKit upload failed, trying server fallback:', directErr);
    }

    // 2. Fallback to server endpoint
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const targetUrl = getApiUrl('/api/admin/upload-image');
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        file: base64Data,
        fileName: file.name,
        folder
      })
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (res.ok && (data.imageUrl || data.url)) {
      return data.imageUrl || data.url;
    }

    throw new Error(data.message || data.error || (res.status === 413 ? 'Image size is too large for the server proxy. Please choose a smaller image.' : `Upload failed with status ${res.status}`));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setFormError('File is too large. Please select an image under 25MB.');
      return;
    }

    setUploadingBanner(true);
    setFormError('');

    try {
      const uploadedUrl = await uploadImageFile(file, '/products');
      setFormImageUrl(uploadedUrl);
    } catch (err: any) {
      console.error('ImageKit Upload Error:', err);
      setFormError(err.message || 'Error uploading file to ImageKit');
    } finally {
      setUploadingBanner(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    setFormError('');

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 25 * 1024 * 1024) {
          throw new Error(`File "${file.name}" is larger than 25MB.`);
        }
        const url = await uploadImageFile(file, '/products');
        uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        setFormGalleryImages(prev => {
          const existing = prev.trim();
          const toAdd = uploadedUrls.join('\n');
          return existing ? `${existing}\n${toAdd}` : toAdd;
        });
      }
    } catch (err: any) {
      console.error('Gallery Upload Error:', err);
      setFormError(err.message || 'Error uploading gallery files');
    } finally {
      setUploadingGallery(false);
      if (e.target) e.target.value = '';
    }
  };

  const safeFetch = async (url: string, init: RequestInit = {}) => {
    const fullUrl = getApiUrl(url);
    try {
      const r = await fetch(fullUrl, init);
      if (r.ok || r.status === 401 || r.status === 400) return r;
      return await fetch(fullUrl, init);
    } catch {
      return await fetch(fullUrl, init);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const res = await safeFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      if (data.token) {
        localStorage.setItem('sv_admin_token', data.token);
        setToken(data.token);
        fetchData(data.token);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sv_admin_token');
    setToken('');
    setLoginPassword('');
  };

  const fetchData = async (overrideToken?: string | unknown) => {
    const activeToken = (typeof overrideToken === 'string' && overrideToken.trim())
      ? overrideToken.trim()
      : (token || localStorage.getItem('sv_admin_token') || '');
    if (!activeToken) return;
    setLoading(true);

    const authHeaders = { Authorization: `Bearer ${activeToken}` };

    try {
      // 1. Fetch Stats
      try {
        const res = await safeFetch('/api/admin/stats', { headers: authHeaders });
        if (res.status === 401 || res.status === 403) {
          if (activeToken === token) {
            handleLogout();
          }
          return;
        }
        if (res.ok) {
          const statsData = await res.json();
          if (statsData && !statsData.error) {
            setStats(statsData);
          }
        }
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }

      // 2. Fetch Courses
      try {
        const res = await safeFetch('/api/admin/courses', { headers: authHeaders });
        if (res.ok) {
          const coursesData = await res.json();
          if (coursesData) {
            if (Array.isArray(coursesData.courses)) {
              setCourses(coursesData.courses);
            } else if (Array.isArray(coursesData)) {
              setCourses(coursesData);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch courses:', e);
      }

      // 3. Fetch Purchases
      try {
        const res = await safeFetch('/api/admin/purchases', { headers: authHeaders });
        if (res.ok) {
          const purchasesData = await res.json();
          if (purchasesData) {
            if (Array.isArray(purchasesData.purchases)) {
              setPurchases(purchasesData.purchases);
            } else if (Array.isArray(purchasesData)) {
              setPurchases(purchasesData);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch purchases:', e);
      }

      // 4. Fetch Registered Customers / Users
      try {
        const res = await safeFetch('/api/admin/users', { headers: authHeaders });
        if (res.ok) {
          const usersData = await res.json();
          if (usersData) {
            const userList = Array.isArray(usersData.users) ? usersData.users : (Array.isArray(usersData.customers) ? usersData.customers : []);
            setUsers(userList);
          }
        }
      } catch (e) {
        console.error('Failed to fetch users:', e);
      }

      // 5. Fetch Bonus Product Settings (Supports array of up to 3 bonuses)
      try {
        const res = await safeFetch('/api/bonus-product');
        if (res.ok) {
          const bData = await res.json();
          if (bData) {
            let list: any[] = [];
            if (Array.isArray(bData.bonuses) && bData.bonuses.length > 0) {
              list = bData.bonuses;
            } else if (Array.isArray(bData) && bData.length > 0) {
              list = bData;
            } else if (bData && typeof bData === 'object' && (bData.title || bData.id)) {
              list = [{
                id: bData.id || 'bonus-vip-toolkit',
                enabled: bData.enabled ?? true,
                title: bData.title || 'Add VIP Developer Toolkit & Cheat-Sheets',
                price: bData.price ? String(bData.price) : '149',
                originalPrice: bData.originalPrice ? String(bData.originalPrice) : '999',
                category: bData.category || 'Software & Tools',
                description: bData.description || 'Unlock 50+ scripts, cheat-sheets & tools for just ₹149 extra.',
                selectedProductId: bData.selectedProductId || bData.selected_product_id || '',
                imageUrl: bData.imageUrl || '',
                driveUrl: bData.driveUrl || bData.drive_url || ''
              }];
            }
            if (list.length > 0) {
              const sanitizedList = list.slice(0, 3).map((b, bIdx) => {
                const isProductCollision = (Array.isArray(courses) ? courses : []).some(c => c && c.id === b.id);
                const safeId = (b.id && b.id.startsWith('bonus-') && !isProductCollision)
                  ? b.id
                  : `bonus-offer-${bIdx + 1}`;
                return {
                  ...b,
                  id: safeId,
                  selectedProductId: b.selectedProductId || b.selected_product_id || ''
                };
              });
              setBonuses(sanitizedList);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch bonus product config:', e);
      }

    } finally {
      setLoading(false);
    }
  };

  const handleAddBonusSlot = () => {
    if (bonuses.length >= 3) return;
    const nextIdx = bonuses.length + 1;
    setBonuses([
      ...bonuses,
      {
        id: `bonus-offer-${Date.now()}`,
        enabled: true,
        title: `Bonus #${nextIdx} - VIP Resource Pack`,
        price: '99',
        originalPrice: '499',
        category: 'Software & Tools',
        description: 'Exclusive bonus add-on for your order.',
        selectedProductId: ''
      }
    ]);
  };

  const handleRemoveBonusSlot = (index: number) => {
    if (bonuses.length <= 1) return;
    setBonuses(bonuses.filter((_, i) => i !== index));
  };

  const handleUpdateBonusField = (index: number, field: string, value: any) => {
    setBonuses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveBonusConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBonus(true);
    setBonusSuccessMsg('');
    try {
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
      const primaryBonus = (bonuses[0] || {}) as any;
      const res = await safeFetch('/api/admin/bonus-product', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          bonuses: bonuses,
          enabled: bonuses.some((b) => b.enabled),
          id: primaryBonus.id || 'bonus-vip-toolkit',
          title: primaryBonus.title || '',
          price: primaryBonus.price || '',
          originalPrice: primaryBonus.originalPrice || '',
          category: primaryBonus.category || 'Software & Tools',
          description: primaryBonus.description || '',
          imageUrl: primaryBonus.imageUrl || ''
        })
      });
      if (res.ok) {
        setBonusSuccessMsg(`🎁 ${bonuses.length} Bonus Offer(s) updated successfully! Live on Checkout page.`);
        setTimeout(() => setBonusSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      console.error('Failed to save bonus config:', err);
    } finally {
      setSavingBonus(false);
    }
  };



  useEffect(() => {
    if (token) {
      fetchData(token);
    }
  }, [token]);

  const handleOpenModal = (course?: CourseItem) => {
    setFormError('');
    setActiveFormTab('basic');
    if (course) {
      setEditingCourse(course);
      setFormId(course.id);
      setFormTitle(course.title);
      setFormSubtitle(course.subtitle || '');
      setFormDescription(course.description || '');
      setFormCategory(course.category || 'Course');
      setFormPrice(String(course.priceInr));
      setFormOriginalPrice(String(course.originalPriceInr));
      setFormIsPublished(course.isPublished);
      setFormDriveUrl(course.driveUrl || '');
      setFormImageUrl(course.imageUrl || '');
      setFormRazorpayPaymentUrl(course.razorpayPaymentUrl || '');
      setFormDuration(course.duration || '');
      setFormFeatures(course.features ? course.features.join(', ') : '');
      setFormBonus(course.bonus || '');
      setFormInstallationProcess((course as any).installationProcess || (course as any).installation_process || '');
      const gallery = (course as any).galleryImages || (course as any).gallery_images;
      setFormGalleryImages(Array.isArray(gallery) ? gallery.join('\n') : (typeof gallery === 'string' ? JSON.parse(gallery).join('\n') : ''));
      setFormModules(course.modules ? course.modules.map(m => typeof m === 'string' ? m : m.title).join('\n') : '');
      setFormTestimonials(course.testimonials ? course.testimonials.map(t => `${t.name} | ${t.comment}`).join('\n') : '');
      setFormFaqs(course.faqs ? course.faqs.map(f => Array.isArray(f) ? `${f[0]} | ${f[1]}` : `${f.question} | ${f.answer}`).join('\n') : '');
    } else {
      setEditingCourse(null);
      setFormId('');
      setFormTitle('');
      setFormSubtitle('');
      setFormDescription('');
      setFormCategory('Course');
      setFormPrice('1999');
      setFormOriginalPrice('4999');
      setFormIsPublished(true);
      setFormDriveUrl('');
      setFormImageUrl('');
      setFormRazorpayPaymentUrl('');
      setFormDuration('');
      setFormFeatures('');
      setFormBonus('');
      setFormInstallationProcess('');
      setFormGalleryImages('');
      setFormModules('');
      setFormTestimonials('');
      setFormFaqs('');
    }
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const parsedModules = formModules
      ? formModules.split('\n').map(line => line.trim()).filter(Boolean).map(title => ({ title, detail: 'Practical hands-on lab module.', lessons: '1 Lesson' }))
      : null;

    const parsedTestimonials = formTestimonials
      ? formTestimonials.split('\n').map(line => {
        const parts = line.split('|');
        return { name: parts[0]?.trim() || 'Verified Learner', comment: parts[1]?.trim() || parts[0]?.trim() || '' };
      }).filter(t => t.comment)
      : null;

    const parsedFaqs = formFaqs
      ? formFaqs.split('\n').map(line => {
        const parts = line.split('|');
        return { question: parts[0]?.trim() || '', answer: parts[1]?.trim() || '' };
      }).filter(f => f.question && f.answer)
      : null;

    const parsedGallery = formGalleryImages
      ? formGalleryImages.split('\n').map(u => u.trim()).filter(Boolean)
      : null;

    const payload = {
      id: formId.toLowerCase().trim().replace(/\s+/g, '-'),
      title: formTitle,
      subtitle: formSubtitle,
      description: formDescription,
      category: formCategory,
      priceInr: Number(formPrice),
      originalPriceInr: Number(formOriginalPrice),
      isPublished: formIsPublished,
      driveUrl: formDriveUrl,
      imageUrl: formImageUrl,
      razorpayPaymentUrl: formRazorpayPaymentUrl || null,
      duration: formDuration || null,
      features: formFeatures ? formFeatures.split(',').map(s => s.trim()).filter(Boolean) : null,
      bonus: formBonus || null,
      installationProcess: formInstallationProcess || null,
      galleryImages: parsedGallery,
      modules: parsedModules,
      testimonials: parsedTestimonials,
      faqs: parsedFaqs
    };

    try {
      let res;
      if (editingCourse) {
        res = await safeFetch(`/api/admin/courses/${encodeURIComponent(editingCourse.id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await safeFetch('/api/admin/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteCourse = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');

    const targetId = deleteTarget.id;

    try {
      const res = await safeFetch(`/api/admin/courses/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete product from Database');
      } else {
        setCourses((prev) => prev.filter((c) => c.id.toLowerCase() !== targetId.toLowerCase()));
        setDeleteTarget(null);
        await fetchData();
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete product from Database');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (course: CourseItem) => {
    const previousState = course.isPublished;
    // Optimistic UI update
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, isPublished: !previousState } : c))
    );

    try {
      const res = await safeFetch(`/api/admin/courses/${encodeURIComponent(course.id)}/toggle-publish`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to toggle product status');
      }
      const data = await res.json();
      if (typeof data.isPublished === 'boolean') {
        setCourses((prev) =>
          prev.map((c) => (c.id === course.id ? { ...c, isPublished: data.isPublished } : c))
        );
      }
      await fetchData();
    } catch (err: any) {
      // Revert state on error
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, isPublished: previousState } : c))
      );
      alert(err.message || 'Error updating product publish status');
    }
  };

  // Delete Customer Account Handler
  const handleDeleteUser = async (userId: string) => {
    if (!userId || !window.confirm('Are you sure you want to delete this customer account?')) return;
    try {
      const authHeaders = { Authorization: `Bearer ${token}` };
      const res = await safeFetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  // Open Custom Theme Access Confirmation Modal
  const handleOpenAccessModal = (u: any) => {
    setAccessConfirmModal({
      isOpen: true,
      user: {
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        isDisabled: Boolean(u.isDisabled)
      }
    });
  };

  const handleExecuteToggleUserAccess = async () => {
    if (!accessConfirmModal.user) return;
    const { id, isDisabled } = accessConfirmModal.user;

    try {
      const authHeaders = { Authorization: `Bearer ${token}` };
      const res = await safeFetch(`/api/admin/users/${encodeURIComponent(id)}/toggle-access`, {
        method: 'POST',
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.success(data.message || (isDisabled ? 'User access restored.' : 'User session revoked & access disabled!'));
        setAccessConfirmModal({ isOpen: false, user: null });
        await fetchData();
      } else {
        toast.error('Failed to update user access status.');
      }
    } catch (err: any) {
      console.error('Failed to toggle user access:', err);
      toast.error('Network error updating user status.');
    }
  };

  // Delete Purchase Log Handler
  const handleDeletePurchase = async (purchaseId: string) => {
    if (!purchaseId || !window.confirm('Are you sure you want to delete this purchase sales record?')) return;
    try {
      const authHeaders = { Authorization: `Bearer ${token}` };
      const res = await safeFetch(`/api/admin/purchases/${encodeURIComponent(purchaseId)}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        setPurchases((prev) => prev.filter((p) => p.id !== purchaseId));
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to delete purchase log:', err);
    }
  };

  // Edit User Handler
  const handleOpenUserModal = (u: any) => {
    setEditingUser(u);
    setUserNameForm(u.name || '');
    setUserEmailForm(u.email || '');
    setUserPhoneForm(u.phone || '');
    setUserPasswordForm('');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
      const res = await safeFetch(`/api/admin/users/${encodeURIComponent(editingUser.id)}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: userNameForm,
          email: userEmailForm,
          phone: userPhoneForm,
          password: userPasswordForm || undefined
        })
      });
      if (res.ok) {
        setEditingUser(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    } finally {
      setSavingUser(false);
    }
  };

  // Edit Purchase Handler
  const handleOpenPurchaseModal = (p: PurchaseItem) => {
    setEditingPurchase(p);
    setPurchaseAccessDeliveredForm(Boolean(p.accessDelivered));
    setPurchaseAmountForm(String(p.amountPaidInr || 0));
    setPurchasePaymentIdForm(p.paymentId || '');
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    setSavingPurchase(true);
    try {
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
      const res = await safeFetch(`/api/admin/purchases/${encodeURIComponent(editingPurchase.id)}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          accessDelivered: purchaseAccessDeliveredForm,
          amountPaidInr: Number(purchaseAmountForm),
          paymentId: purchasePaymentIdForm
        })
      });
      if (res.ok) {
        setEditingPurchase(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to update purchase:', err);
    } finally {
      setSavingPurchase(false);
    }
  };

  // Add Manual Purchase Handler
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPurchaseEmail || !addPurchaseCourseId) return;
    setSubmittingPurchase(true);
    try {
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
      const res = await safeFetch('/api/admin/purchases', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userEmail: addPurchaseEmail,
          userName: addPurchaseName,
          userPhone: addPurchasePhone,
          courseId: addPurchaseCourseId,
          amountPaidInr: Number(addPurchaseAmount),
          paymentId: addPurchasePaymentId || `MANUAL_${Date.now()}`,
          accessDelivered: addPurchaseAccessDelivered
        })
      });
      if (res.ok) {
        setIsAddPurchaseModalOpen(false);
        setAddPurchaseEmail('');
        setAddPurchaseName('');
        setAddPurchasePhone('');
        setAddPurchasePaymentId('');
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to add manual purchase:', err);
    } finally {
      setSubmittingPurchase(false);
    }
  };

  const filteredCourses = (Array.isArray(courses) ? courses : []).filter((course) => {
    if (!course) return false;
    const cat = course.category || '';
    const title = course.title || '';
    const id = course.id || '';

    const matchesCategory =
      selectedCategory === 'All Products' ||
      selectedCategory === 'All Courses' ||
      cat.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      title.toLowerCase().includes((courseSearch || '').toLowerCase()) ||
      id.toLowerCase().includes((courseSearch || '').toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Pure Sales & Purchases Log Filter with Guest vs Registered Filter & Date Filtering
  const filteredPurchases = useMemo(() => {
    const q = (buyerSearch || '').toLowerCase().trim();
    let list = Array.isArray(purchases) ? purchases : [];

    if (buyerFilterType === 'guest') {
      list = list.filter((p) => p && p.userEmail && !users.some((u) => u && u.email && u.email.toLowerCase().trim() === p.userEmail.toLowerCase().trim()));
    } else if (buyerFilterType === 'registered') {
      list = list.filter((p) => p && p.userEmail && users.some((u) => u && u.email && u.email.toLowerCase().trim() === p.userEmail.toLowerCase().trim()));
    }

    if (buyerDatePreset !== 'all' || buyerStartDate || buyerEndDate) {
      const now = new Date();
      let startDateObj: Date | null = null;
      let endDateObj: Date | null = null;

      if (buyerDatePreset === 'today') {
        startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (buyerDatePreset === 'yesterday') {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        startDateObj = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
        endDateObj = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      } else if (buyerDatePreset === '7days') {
        const d7 = new Date(now);
        d7.setDate(d7.getDate() - 6);
        startDateObj = new Date(d7.getFullYear(), d7.getMonth(), d7.getDate(), 0, 0, 0, 0);
        endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (buyerDatePreset === '30days') {
        const d30 = new Date(now);
        d30.setDate(d30.getDate() - 29);
        startDateObj = new Date(d30.getFullYear(), d30.getMonth(), d30.getDate(), 0, 0, 0, 0);
        endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (buyerDatePreset === 'thisMonth') {
        startDateObj = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      } else if (buyerDatePreset === 'custom') {
        if (buyerStartDate) {
          const [sY, sM, sD] = buyerStartDate.split('-').map(Number);
          if (sY && sM && sD) {
            startDateObj = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
          }
        }
        if (buyerEndDate) {
          const [eY, eM, eD] = buyerEndDate.split('-').map(Number);
          if (eY && eM && eD) {
            endDateObj = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
          }
        }
      }

      list = list.filter((p) => {
        if (!p) return false;
        const rawDate = p.createdAt || (p as any).created_at;
        if (!rawDate) return false;
        const itemDate = new Date(rawDate);
        if (isNaN(itemDate.getTime())) return false;

        if (startDateObj && itemDate < startDateObj) return false;
        if (endDateObj && itemDate > endDateObj) return false;
        return true;
      });
    }

    if (!q) return list;

    return list.filter((p) => {
      if (!p) return false;
      const email = p.userEmail || '';
      const name = p.userName || '';
      const phone = p.userPhone || '';
      const courseId = p.courseId || '';
      const paymentId = p.paymentId || '';

      return (
        email.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q) ||
        courseId.toLowerCase().includes(q) ||
        paymentId.toLowerCase().includes(q)
      );
    });
  }, [purchases, users, buyerSearch, buyerFilterType, buyerDatePreset, buyerStartDate, buyerEndDate]);

  useEffect(() => {
    setPurchasesPage(1);
  }, [buyerSearch, buyerFilterType, buyerDatePreset, buyerStartDate, buyerEndDate]);

  // Unified Customers List (Combines Registered Account Users and Guest Checkout Buyers)
  const combinedCustomers = useMemo(() => {
    const customerMap = new Map<string, any>();

    // 1. Registered Account Users (excluding admins)
    (Array.isArray(users) ? users : []).forEach((u) => {
      if (u && u.email && u.role !== 'admin') {
        const cleanEmail = u.email.toLowerCase().trim();
        customerMap.set(cleanEmail, {
          id: u.id,
          email: u.email,
          name: u.name || 'Registered Customer',
          phone: u.phone || 'N/A',
          isRegistered: true,
          isDisabled: u.isDisabled || u.is_disabled || false,
          hasPassword: u.hasPassword,
          createdAt: u.createdAt
        });
      }
    });

    // 2. Guest Checkout Buyers
    (Array.isArray(purchases) ? purchases : []).forEach((p) => {
      if (p && p.userEmail) {
        const cleanEmail = p.userEmail.toLowerCase().trim();
        if (!customerMap.has(cleanEmail)) {
          customerMap.set(cleanEmail, {
            id: `guest_${p.id || cleanEmail}`,
            email: p.userEmail,
            name: p.userName || 'Guest Customer',
            phone: p.userPhone || 'N/A',
            isRegistered: false,
            createdAt: p.createdAt
          });
        } else {
          const existing = customerMap.get(cleanEmail);
          if ((!existing.phone || existing.phone === 'N/A') && p.userPhone) {
            existing.phone = p.userPhone;
          }
          if ((!existing.name || existing.name === 'Registered Customer') && p.userName) {
            existing.name = p.userName;
          }
        }
      }
    });

    return Array.from(customerMap.values());
  }, [users, purchases]);

  const filteredCombinedCustomers = useMemo(() => {
    const q = (userSearch || '').toLowerCase().trim();
    if (!q) return combinedCustomers;

    return combinedCustomers.filter((c) => {
      if (!c) return false;
      const id = (c.id || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return id.includes(q) || email.includes(q) || name.includes(q) || phone.includes(q);
    });
  }, [combinedCustomers, userSearch]);

  const paginatedCourses = useMemo(() => {
    return filteredCourses.slice((coursesPage - 1) * ITEMS_PER_PAGE, coursesPage * ITEMS_PER_PAGE);
  }, [filteredCourses, coursesPage]);

  const paginatedPurchases = useMemo(() => {
    return filteredPurchases.slice((purchasesPage - 1) * ITEMS_PER_PAGE, purchasesPage * ITEMS_PER_PAGE);
  }, [filteredPurchases, purchasesPage]);

  const paginatedCustomers = useMemo(() => {
    return filteredCombinedCustomers.slice((usersPage - 1) * ITEMS_PER_PAGE, usersPage * ITEMS_PER_PAGE);
  }, [filteredCombinedCustomers, usersPage]);

  // LOGIN SCREEN RENDER
  if (!token) {
    return (
      <div className="min-h-screen bg-[#06070a] text-slate-100 flex items-center justify-center p-4">
        <div className="bg-[#0d0f19] border border-slate-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500" />

          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Skill Vault Admin Portal</h1>
            <p className="text-xs text-slate-400">Enter your administrator credentials to access dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-center font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Admin Username</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Admin Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 px-4 font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Credentials...
                </>
              ) : (
                'Login to Admin Dashboard ➔'
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setLocation('/')}
              className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Return to Skill Vault Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD RENDER
  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 font-sans p-3 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 min-w-0">
        <div>
          <button
            onClick={() => setLocation('/')}
            className="inline-flex items-center text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Main Site
          </button>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 flex-wrap">
            <span>Skill Vault Admin Panel</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              Authenticated
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage products, view live sales revenue, and buyer transaction records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-lg shadow-lg shadow-violet-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <a
            href={getApiUrl('/api/admin/whatsapp/qr')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
            title="Scan WhatsApp QR Code or Check Status"
          >
            <Sparkles className="w-3.5 h-3.5" /> WhatsApp QR / Status
          </a>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
            title="Logout Admin"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      <div className="w-full min-w-0 max-w-7xl mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0d0f19] border border-slate-800/80 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-emerald-500/10">
              <DollarSign className="w-16 h-16" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-emerald-400 mt-2">
              ₹{(Number(stats?.totalRevenueInr) || 0).toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">Generated from Razorpay sales</p>
          </div>

          <div className="bg-[#0d0f19] border border-slate-800/80 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-violet-500/10">
              <ShoppingBag className="w-16 h-16" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Purchases</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-violet-400 mt-2">
              {stats.totalPurchases}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">Confirmed course orders</p>
          </div>

          <div className="bg-[#0d0f19] border border-slate-800/80 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-cyan-500/10">
              <Users className="w-16 h-16" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Customers</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-cyan-400 mt-2">
              {combinedCustomers.length || stats.totalUsers}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              <strong className="text-violet-300">{users.filter(u => u && u.role !== 'admin').length}</strong> Registered • <strong className="text-cyan-300">{Math.max(0, combinedCustomers.length - users.filter(u => u && u.role !== 'admin').length)}</strong> Guest Buyers
            </p>
          </div>

          <div className="bg-[#0d0f19] border border-slate-800/80 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 text-amber-500/10">
              <BookOpen className="w-16 h-16" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Products</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-amber-400 mt-2">
              {stats.totalCourses}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">Catalog courses</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-3 sm:gap-8 text-xs sm:text-sm font-semibold overflow-x-auto scrollbar-none w-full max-w-full pb-0.5">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'products'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <BookOpen className="w-4 h-4" /> Products ({courses.length})
          </button>

          <button
            onClick={() => setActiveTab('buyers')}
            className={`pb-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'buyers'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <ShoppingBag className="w-4 h-4" /> Buyers & Sales Log ({purchases.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'users'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Users className="w-4 h-4 text-cyan-400" /> Customers ({combinedCustomers.length})
          </button>

          <button
            onClick={() => setActiveTab('bonus')}
            className={`pb-4 border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${activeTab === 'bonus'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> 🎁 Bonus Offer Manager
          </button>


        </div>

        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-[#0d0f19] border border-slate-800/80 p-4 rounded-xl">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search products by title or ID..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Courses Table */}
            <div className="bg-[#0d0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3.5 px-4">Product ID / Course</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price (₹)</th>
                      <th className="py-3.5 px-4">Original Price (₹)</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No products match your criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedCourses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {course.imageUrl ? (
                                <img
                                  src={course.imageUrl}
                                  alt={course.title}
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-700 bg-slate-900 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center justify-center text-slate-600 text-[10px] font-mono shrink-0">
                                  No Img
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-100">{course.title}</div>
                                <div className="text-[11px] text-violet-400 font-mono mt-0.5">{course.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-300">
                            <span className="inline-block bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px]">
                              {course.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-emerald-400">
                            ₹{(Number(course?.priceInr ?? (course as any)?.price_inr) || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-slate-500 line-through">
                            ₹{(Number(course?.originalPriceInr ?? (course as any)?.original_price_inr) || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(course)}
                              className="cursor-pointer transition-transform hover:scale-105 group"
                              title={course.isPublished ? "Click to unpublish from live catalog" : "Click to publish to live catalog"}
                            >
                              {course.isPublished ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full group-hover:bg-emerald-500/20">
                                  <CheckCircle className="w-3 h-3" /> Published
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full group-hover:bg-amber-500/20">
                                  <XCircle className="w-3 h-3" /> Draft
                                </span>
                              )}
                            </button>
                            {course.driveUrl && (
                              <span className="ml-2 inline-flex items-center gap-1 text-cyan-400 text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full" title={course.driveUrl}>
                                Drive Attached
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleOpenModal(course)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteError('');
                                  setDeleteTarget(course);
                                }}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/30 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                currentPage={coursesPage}
                totalItems={filteredCourses.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCoursesPage}
              />
            </div>
          </div>
        )}

        {/* TAB 2: BUYERS & SALES LOG */}
        {activeTab === 'buyers' && (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-[#0d0f19] border border-slate-800/80 p-4 rounded-xl space-y-4 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by buyer email, phone, name, or payment ID..."
                    value={buyerSearch}
                    onChange={(e) => setBuyerSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {/* Buyer Type */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-semibold shrink-0">Type:</span>
                    <select
                      value={buyerFilterType}
                      onChange={(e) => setBuyerFilterType(e.target.value as any)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="all">All Buyers ({purchases.length})</option>
                      <option value="guest">🛒 Guest Only ({purchases.filter(p => !users.some(u => u?.email?.toLowerCase().trim() === p?.userEmail?.toLowerCase().trim())).length})</option>
                      <option value="registered">👤 Registered Only ({purchases.filter(p => users.some(u => u?.email?.toLowerCase().trim() === p?.userEmail?.toLowerCase().trim())).length})</option>
                    </select>
                  </div>

                  {/* Date Range Preset */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="text-slate-400 font-semibold shrink-0">Date Filter:</span>
                    <select
                      value={buyerDatePreset}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setBuyerDatePreset(val);
                        if (val !== 'custom') {
                          setBuyerStartDate('');
                          setBuyerEndDate('');
                        }
                      }}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer font-medium"
                    >
                      <option value="all">📅 All Time</option>
                      <option value="today">📌 Today</option>
                      <option value="yesterday">↩️ Yesterday</option>
                      <option value="7days">🗓️ Last 7 Days</option>
                      <option value="30days">🗓️ Last 30 Days</option>
                      <option value="thisMonth">📅 This Month</option>
                      <option value="custom">⚙️ Custom Range...</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Custom Date Pickers & Active Filter Summary Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
                {buyerDatePreset === 'custom' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-400 text-[11px] font-medium">From:</span>
                    <input
                      type="date"
                      value={buyerStartDate}
                      onChange={(e) => setBuyerStartDate(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-violet-500 text-xs cursor-pointer"
                    />
                    <span className="text-slate-400 text-[11px] font-medium">To:</span>
                    <input
                      type="date"
                      value={buyerEndDate}
                      onChange={(e) => setBuyerEndDate(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-violet-500 text-xs cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {buyerDatePreset === 'all' && 'Showing all historical transactions.'}
                      {buyerDatePreset === 'today' && 'Filtering transactions created today.'}
                      {buyerDatePreset === 'yesterday' && 'Filtering transactions created yesterday.'}
                      {buyerDatePreset === '7days' && 'Filtering transactions from the last 7 days.'}
                      {buyerDatePreset === '30days' && 'Filtering transactions from the last 30 days.'}
                      {buyerDatePreset === 'thisMonth' && 'Filtering transactions for the current month.'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 ml-auto">
                  <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 font-medium text-[11px] flex items-center gap-1.5">
                    <span>Summary:</span>
                    <span className="font-bold text-white">{filteredPurchases.length} Sales</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-400">
                      ₹{filteredPurchases.reduce((sum, p) => sum + (Number(p?.amountPaidInr ?? (p as any)?.amount_paid_inr) || 0), 0).toLocaleString()}
                    </span>
                  </div>

                  {(buyerDatePreset !== 'all' || buyerStartDate || buyerEndDate) && (
                    <button
                      onClick={resetBuyerDateFilter}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                      title="Clear Date Filter"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reset Dates
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Buyers Table */}
            <div className="bg-[#0d0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3.5 px-4">Order ID</th>
                      <th className="py-3.5 px-4">Email Address</th>
                      <th className="py-3.5 px-4">Purchased Orders</th>
                      <th className="py-3.5 px-4">Purchase Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500">
                          No buyer transactions found.
                        </td>
                      </tr>
                    ) : (
                      paginatedPurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-4 px-4 font-mono text-violet-400 text-xs font-bold">
                            {purchase.paymentId || purchase.id.slice(0, 12)}
                          </td>
                          <td className="py-4 px-4 text-cyan-400 font-mono text-[11px]">
                            {purchase.userEmail}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-100 text-xs">
                              {(() => {
                                const foundCourse = (Array.isArray(courses) ? courses : []).find(c => c && c.id === purchase.courseId);
                                const foundBonus = (Array.isArray(bonuses) ? bonuses : []).find(b => b && b.id === purchase.courseId);
                                if (foundCourse) return foundCourse.title;
                                if (foundBonus) return `${foundBonus.title} (Bonus Offer)`;
                                return purchase.courseId;
                              })()}
                            </div>
                            <div className="text-emerald-400 font-mono text-[11px] font-bold mt-0.5">
                              ₹{(Number(purchase?.amountPaidInr ?? (purchase as any)?.amount_paid_inr) || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-[11px] font-mono">
                            {purchase?.createdAt || (purchase as any)?.created_at ? new Date(purchase?.createdAt || (purchase as any)?.created_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleOpenPurchaseModal(purchase)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer"
                                title="Edit Sales Record"
                              >
                                <Edit className="w-3.5 h-3.5 text-violet-400" />
                              </button>
                              <button
                                onClick={() => handleDeletePurchase(purchase.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/30 transition-colors cursor-pointer"
                                title="Delete Sales Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                currentPage={purchasesPage}
                totalItems={filteredPurchases.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setPurchasesPage}
              />
            </div>
          </div>
        )}

        {/* TAB 3: ALL CUSTOMERS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-[#0d0f19] border border-slate-800/80 p-4 rounded-xl">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-[#0d0f19] border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Email Address</th>
                      <th className="py-3.5 px-4">Phone Number</th>
                      <th className="py-3.5 px-4">Customer Type</th>
                      <th className="py-3.5 px-4">Purchased Orders</th>
                      <th className="py-3.5 px-4">Date Added</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {filteredCombinedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500">
                          No customers found.
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map((u) => {
                        const userPurchases = purchases.filter(p => p && p.userEmail && u.email && p.userEmail.toLowerCase().trim() === u.email.toLowerCase().trim());
                        return (
                          <tr key={u.id || u.email} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-4 px-4 font-bold text-slate-100">
                              {u.name || (u.isRegistered ? 'Registered Customer' : 'Guest Customer')}
                            </td>
                            <td className="py-4 px-4 text-cyan-400 font-mono text-[11px]">
                              {u.email}
                            </td>
                            <td className="py-4 px-4 text-slate-300 font-mono text-[11px]">
                              {u.phone || 'N/A'}
                            </td>
                            <td className="py-4 px-4">
                              {u.isRegistered ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                                  👤 Registered Account
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                  🛒 Guest Buyer
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {userPurchases.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-violet-300 text-[11px] font-bold bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
                                  🛍️ {userPurchases.length} Order{userPurchases.length > 1 ? 's' : ''}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[11px]">0 Purchases</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-slate-500 text-[11px]">
                              {u?.createdAt || (u as any)?.created_at ? new Date(u?.createdAt || (u as any)?.created_at).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                {u.isRegistered && (
                                  <button
                                    onClick={() => handleOpenAccessModal(u)}
                                    className={`p-1.5 rounded border transition-colors cursor-pointer ${
                                      u.isDisabled
                                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                                    }`}
                                    title={u.isDisabled ? 'Restore Customer Access' : 'Revoke Session & Disable Access'}
                                  >
                                    {u.isDisabled ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                                {u.isRegistered && (
                                  <button
                                    onClick={() => handleOpenUserModal(u)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors cursor-pointer"
                                    title="Edit Customer Account"
                                  >
                                    <Edit className="w-3.5 h-3.5 text-cyan-400" />
                                  </button>
                                )}
                                {u.isRegistered && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/30 transition-colors cursor-pointer"
                                    title="Delete Customer Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                currentPage={usersPage}
                totalItems={filteredCombinedCustomers.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setUsersPage}
              />
            </div>
          </div>
        )}

        {/* TAB 4: MULTIPLE BONUS OFFERS MANAGER (MAX 3 OFFERS) */}
        {activeTab === 'bonus' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#0d0f19] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" /> Checkout Bonus Offers Manager
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage up to 3 Order Bump Bonus Offers for your checkout page.
                  </p>
                </div>
                {bonuses.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddBonusSlot}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-amber-500/20 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Add Bonus Offer ({bonuses.length}/3)
                  </button>
                )}
              </div>

              {bonusSuccessMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" /> {bonusSuccessMsg}
                </div>
              )}

              <form onSubmit={handleSaveBonusConfig} className="space-y-6 text-xs">
                {bonuses.map((bItem, idx) => (
                  <div key={bItem.id || idx} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 relative">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          Bonus Offer #{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                          {bItem.title || 'Untitled Bonus'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                          <span>Active</span>
                          <input
                            type="checkbox"
                            checked={bItem.enabled}
                            onChange={(e) => handleUpdateBonusField(idx, 'enabled', e.target.checked)}
                            className="w-4 h-4 text-violet-600 rounded cursor-pointer accent-violet-600"
                          />
                        </label>
                        {bonuses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBonusSlot(idx)}
                            className="text-slate-500 hover:text-red-400 p-1 rounded transition cursor-pointer"
                            title="Remove this bonus offer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SELECT PRODUCT FROM DATABASE DROPDOWN */}
                    <div className="bg-slate-950/80 border border-violet-500/30 rounded-xl p-3.5 space-y-1.5">
                      <label className="block font-bold text-violet-300 text-xs flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" /> Auto-fill from Catalog Product:
                      </label>
                      <select
                        value={bItem.selectedProductId || ''}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const found = (Array.isArray(courses) ? courses : []).find((c) => c && c.id === pId);
                          setBonuses((prev) => {
                            const updated = [...prev];
                            const existingId = updated[idx]?.id;
                            const isCollision = (Array.isArray(courses) ? courses : []).some(c => c && c.id === existingId);
                            const safeId = (existingId && existingId.startsWith('bonus-') && !isCollision && existingId !== pId)
                              ? existingId
                              : `bonus-offer-${Date.now()}_${idx + 1}`;

                            if (found) {
                              updated[idx] = {
                                ...updated[idx],
                                id: safeId,
                                selectedProductId: pId,
                                title: found.title,
                                originalPrice: String(found.priceInr || found.originalPriceInr || ''),
                                category: found.category || 'Software & Tools',
                                description: found.description || found.subtitle || 'Special discounted bonus add-on.',
                                imageUrl: found.imageUrl || updated[idx].imageUrl || '',
                                driveUrl: found.driveUrl || updated[idx].driveUrl || ''
                              };
                            } else {
                              updated[idx] = {
                                ...updated[idx],
                                id: safeId,
                                selectedProductId: pId
                              };
                            }
                            return updated;
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 cursor-pointer font-mono"
                      >
                        <option value="">-- Or enter custom Bonus details below --</option>
                        {(Array.isArray(courses) ? courses : []).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} (Website Price: ₹{c.priceInr})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Bonus Display Title <span className="text-violet-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bItem.title}
                        onChange={(e) => handleUpdateBonusField(idx, 'title', e.target.value)}
                        placeholder="e.g. Add VIP Developer Toolkit & Cheat-Sheets"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-cyan-300 mb-1 flex items-center gap-1.5 text-xs">
                        <Link className="w-3.5 h-3.5 text-cyan-400" />
                        Google Drive / Bonus Access URL <span className="text-slate-400 font-mono text-[10px]">(Auto-delivered on purchase)</span>
                      </label>
                      <input
                        type="text"
                        value={bItem.driveUrl || ''}
                        onChange={(e) => handleUpdateBonusField(idx, 'driveUrl', e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/... or https://mega.nz/..."
                        className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/30 rounded-xl text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-amber-300 mb-1">
                          Special Bonus Offer Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          value={bItem.price}
                          onChange={(e) => handleUpdateBonusField(idx, 'price', e.target.value)}
                          placeholder="149"
                          className="w-full px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-amber-300 font-bold focus:outline-none focus:border-amber-400 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-400 mb-1">
                          Original / Strike Price (₹)
                        </label>
                        <input
                          type="number"
                          value={bItem.originalPrice}
                          onChange={(e) => handleUpdateBonusField(idx, 'originalPrice', e.target.value)}
                          placeholder="999"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">
                        Bonus Short Description
                      </label>
                      <textarea
                        rows={2}
                        value={bItem.description}
                        onChange={(e) => handleUpdateBonusField(idx, 'description', e.target.value)}
                        placeholder="Brief description of what customer gets..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-violet-500 resize-none"
                      />
                    </div>

                    {/* LIVE PREVIEW */}
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded shrink-0">
                          BONUS #{idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">
                          {bItem.title || 'Bonus Title'}
                        </h4>
                        <span className="text-xs font-bold text-emerald-400 font-mono shrink-0">+₹{bItem.price}</span>
                        <span className="text-[10px] text-slate-500 line-through font-mono shrink-0">₹{bItem.originalPrice}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">
                        {bItem.description || 'Description...'}
                      </p>
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={savingBonus}
                  className="w-full py-3.5 px-4 font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {savingBonus ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving All Bonus Offers...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Save All Bonus Offers Settings ({bonuses.length})
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}


      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0d0f19] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-[#0d0f19] shrink-0">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-violet-400 animate-pulse" />
                {editingCourse ? `Edit: ${editingCourse.title}` : 'Add New Digital Asset / Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Responsive Tab Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto p-2 bg-slate-950 border-b border-slate-800 text-xs font-semibold scrollbar-none px-4 sm:px-6 shrink-0">
              <button
                type="button"
                onClick={() => setActiveFormTab('basic')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeFormTab === 'basic'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                📝 1. Basic Info & Banner
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('access')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeFormTab === 'access'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                🚀 2. Links & Access
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('software')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeFormTab === 'software'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                🛠️ 3. Software & Gallery
                {formCategory.toLowerCase().includes('software') && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('content')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeFormTab === 'content'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                📚 4. Modules & FAQs
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="flex flex-col flex-1 overflow-hidden">
              {/* Tab Panels Body (Scrollable) */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs space-y-4">
                {formError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium">
                    {formError}
                  </div>
                )}

                {/* TAB 1: BASIC INFO */}
                {activeFormTab === 'basic' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Product ID (Slug)</label>
                        <input
                          type="text"
                          required
                          disabled={Boolean(editingCourse)}
                          placeholder="e.g. mern-stack-mastery or windows-tool-pro"
                          value={formId}
                          onChange={(e) => setFormId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Product Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Full Stack Mastery / Windows Utility Software"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Subtitle / Tagline</label>
                      <input
                        type="text"
                        placeholder="Short catchy tagline..."
                        value={formSubtitle}
                        onChange={(e) => setFormSubtitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Category / Type</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                          {CATEGORIES.filter((c) => c !== 'All Products' && c !== 'All Courses').map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Selling Price (INR ₹)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formPrice}
                          onChange={(e) => setFormPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-bold text-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Original Price (INR ₹)</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formOriginalPrice}
                          onChange={(e) => setFormOriginalPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 line-through text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-semibold text-indigo-300">Product Banner Image</label>
                        {formImageUrl && (
                          <button
                            type="button"
                            onClick={() => setFormImageUrl('')}
                            className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                          >
                            Remove Banner
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Image URL or upload directly from PC..."
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-xs"
                        />
                        <label className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg cursor-pointer text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all shadow-md shadow-violet-600/20 active:scale-95">
                          {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          {uploadingBanner ? "Uploading..." : "Upload from PC"}
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/gif"
                            onChange={handleFileUpload}
                            disabled={uploadingBanner}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {formImageUrl && (formImageUrl.startsWith('http://') || formImageUrl.startsWith('https://') || formImageUrl.startsWith('data:') || formImageUrl.startsWith('/')) && (
                        <div className="mt-2.5 relative rounded-xl overflow-hidden border border-slate-800 h-32 bg-slate-950 flex items-center justify-center group">
                          <img
                            src={formImageUrl}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-md text-xs font-semibold cursor-pointer shadow">
                              Change Image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                disabled={uploadingBanner}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <span className="absolute bottom-1.5 right-2 text-[10px] bg-slate-900/90 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ImageKit CDN Active
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-300">
                        <input
                          type="checkbox"
                          checked={formIsPublished}
                          onChange={(e) => setFormIsPublished(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-violet-500 cursor-pointer"
                        />
                        <span>Publish Product to Live Website Catalog</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 2: LINKS & ACCESS */}
                {activeFormTab === 'access' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <label className="block font-semibold text-cyan-400 mb-1">Access / Download Link (Drive, Mega, S3, GitHub)</label>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/... or https://mega.nz/... (Auto-sent on purchase)"
                        value={formDriveUrl}
                        onChange={(e) => setFormDriveUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-cyan-800/60 rounded-lg text-cyan-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-violet-300 mb-1">Custom Razorpay Payment Link (Optional)</label>
                      <input
                        type="url"
                        placeholder="https://rzp.io/rzp/your-product-link (Per-product custom checkout link)"
                        value={formRazorpayPaymentUrl}
                        onChange={(e) => setFormRazorpayPaymentUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-violet-800/60 rounded-lg text-violet-200 focus:outline-none focus:border-violet-400 font-mono text-[11px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Duration / Tag (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 10 Modules • 38 Hours OR v2.4 • 450 MB Zip"
                          value={formDuration}
                          onChange={(e) => setFormDuration(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-amber-300 mb-1">Special Bonus Offer (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Includes FREE Premium Cheat Sheet PDF ($49 Value)"
                          value={formBonus}
                          onChange={(e) => setFormBonus(e.target.value)}
                          className="w-full px-3.5 py-2 bg-slate-900 border border-amber-800/60 rounded-lg text-amber-200 focus:outline-none focus:border-amber-500 text-[11px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Description</label>
                      <textarea
                        rows={3}
                        placeholder="Detailed product description (software features, course modules, or PDF summary)..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Key Features (Comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Lifetime Access, Source Code Included, Instant Download"
                        value={formFeatures}
                        onChange={(e) => setFormFeatures(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: SOFTWARE & MEDIA */}
                {activeFormTab === 'software' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    {/* Software Category Specific Section: Installation Process */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      formCategory.toLowerCase().includes('software')
                        ? 'bg-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                          🛠️ Installation Process & Setup Guide {formCategory.toLowerCase().includes('software') ? '(Recommended for Software)' : '(Optional)'}
                        </label>
                        {formCategory.toLowerCase().includes('software') && (
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                            SOFTWARE CATEGORY ACTIVE
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={4}
                        placeholder={"Step 1: Download zip from Google Drive link.\nStep 2: Extract archive & run setup.exe as Admin.\nStep 3: Paste key into key.txt file in C:\\Program Files\\..."}
                        value={formInstallationProcess}
                        onChange={(e) => setFormInstallationProcess(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-200 focus:outline-none focus:border-emerald-500 font-mono text-[11px] leading-relaxed"
                      />
                    </div>

                    {/* Photo Gallery Screenshots (Optional - Conditional Rendering) */}
                    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                          🖼️ Product Screenshots / Photo Gallery
                        </label>
                        <label className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg cursor-pointer text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 active:scale-95">
                          {uploadingGallery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          {uploadingGallery ? "Uploading..." : "Upload from PC (Multi)"}
                          <input
                            type="file"
                            multiple
                            accept="image/png, image/jpeg, image/webp, image/gif"
                            onChange={handleGalleryUpload}
                            disabled={uploadingGallery}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <textarea
                        rows={4}
                        placeholder={"https://ik.imagekit.io/.../screenshot1.png\nhttps://ik.imagekit.io/.../screenshot2.png"}
                        value={formGalleryImages}
                        onChange={(e) => setFormGalleryImages(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-cyan-200 focus:outline-none focus:border-cyan-500 font-mono text-[11px] leading-relaxed"
                      />
                      <p className="text-[10px] text-slate-400">
                        ⚡ Jin products me aap image links daalenge, sirf unhi me product page par photo gallery section automatic render hoga!
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 4: MODULES & FAQS */}
                {activeFormTab === 'content' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Course Content / Modules (1 per line)</label>
                      <textarea
                        rows={3}
                        placeholder={"Module 01: Setup & Environment\nModule 02: Core Security Labs\nModule 03: Production Deployment"}
                        value={formModules}
                        onChange={(e) => setFormModules(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">What Learners Say / Student Reviews (Name | Comment - 1 per line)</label>
                      <textarea
                        rows={3}
                        placeholder={"Amit Sharma | Excellent hands-on practical labs!\nPriya Verma | Very clear explanation and great support."}
                        value={formTestimonials}
                        onChange={(e) => setFormTestimonials(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">FAQs (Question? | Answer - 1 per line)</label>
                      <textarea
                        rows={3}
                        placeholder={"Is this course beginner friendly? | Yes, it starts from absolute basics.\nHow long do I get access? | You get lifetime access to all updates."}
                        value={formFaqs}
                        onChange={(e) => setFormFaqs(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer (Sticky) */}
              <div className="flex items-center justify-between border-t border-slate-800 p-4 px-6 bg-[#0d0f19] shrink-0">
                <div className="flex items-center gap-2">
                  {activeFormTab !== 'basic' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'basic' | 'access' | 'software' | 'content'> = ['basic', 'access', 'software', 'content'];
                        const prevIdx = tabs.indexOf(activeFormTab) - 1;
                        if (prevIdx >= 0) setActiveFormTab(tabs[prevIdx]);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg font-semibold transition-colors cursor-pointer text-xs"
                    >
                      ← Back
                    </button>
                  )}
                  {activeFormTab !== 'content' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs: Array<'basic' | 'access' | 'software' | 'content'> = ['basic', 'access', 'software', 'content'];
                        const nextIdx = tabs.indexOf(activeFormTab) + 1;
                        if (nextIdx < tabs.length) setActiveFormTab(tabs[nextIdx]);
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg font-semibold transition-colors cursor-pointer text-xs"
                    >
                      Next Tab →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-violet-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {submitting ? 'Saving to DB...' : editingCourse ? 'Update Product' : 'Create & Save Product'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0d0f19] border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Delete Product Confirmation</h3>
                <p className="text-xs text-slate-400">Database Permanent Delete Action</p>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Course Title:</div>
              <div className="font-bold text-slate-100 text-sm">{deleteTarget.title}</div>
              <div className="text-xs font-mono text-violet-400 bg-slate-800/80 px-2 py-1 rounded inline-block">
                ID: {deleteTarget.id}
              </div>
            </div>

            {deleteError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-slate-400">
              Are you sure you want to delete this course? This will remove the record directly from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCourse}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting from DB...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Yes, Delete from Database
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0d0f19] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-cyan-400" /> Edit Customer Account Details
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={userNameForm}
                  onChange={(e) => setUserNameForm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={userEmailForm}
                  onChange={(e) => setUserEmailForm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={userPhoneForm}
                  onChange={(e) => setUserPhoneForm(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">Account Login Type</span>
                {editingUser.hasPassword ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    🔑 Email & Password User
                  </span>
                ) : (
                  <span className="text-cyan-400 font-bold flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    🌐 Google SSO User
                  </span>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Set / Update Password {editingUser.hasPassword ? '(Optional)' : '(Enable Email/Password Login)'}
                </label>
                <input
                  type="password"
                  value={userPasswordForm}
                  onChange={(e) => setUserPasswordForm(e.target.value)}
                  placeholder={editingUser.hasPassword ? 'Leave blank to keep existing password' : 'Enter new password for customer'}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {editingUser.hasPassword
                    ? 'Customer direct Email/Password se account chala raha hai. Password badalne ke liye yaha type karein.'
                    : 'Customer Google SSO se aaya hai. Aap naya password set karke unko direct email login allow kar sakte hain.'}
                </p>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {savingUser ? 'Saving...' : 'Save Customer Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Purchase Sales Record Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0d0f19] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-violet-400" /> Edit Sales Transaction Record
              </h3>
              <button
                onClick={() => setEditingPurchase(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePurchase} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Razorpay Payment ID</label>
                <input
                  type="text"
                  value={purchasePaymentIdForm}
                  onChange={(e) => setPurchasePaymentIdForm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  required
                  value={purchaseAmountForm}
                  onChange={(e) => setPurchaseAmountForm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <label className="font-semibold text-slate-300 cursor-pointer">Drive Access Delivered Status</label>
                <input
                  type="checkbox"
                  checked={purchaseAccessDeliveredForm}
                  onChange={(e) => setPurchaseAccessDeliveredForm(e.target.checked)}
                  className="w-4 h-4 text-violet-600 rounded cursor-pointer accent-violet-600"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPurchase}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {savingPurchase ? 'Saving...' : 'Save Transaction Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Theme Session Revocation / Access Restore Modal */}
      {accessConfirmModal.isOpen && accessConfirmModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0d0f19] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative border-t-2 border-t-violet-500">
            <div className="p-6 text-center space-y-4">
              <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
                accessConfirmModal.user.isDisabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/10'
              }`}>
                {accessConfirmModal.user.isDisabled ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <ShieldAlert className="w-7 h-7" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-white">
                  {accessConfirmModal.user.isDisabled ? 'Restore Account Access?' : 'Revoke Session & Disable Access?'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {accessConfirmModal.user.isDisabled
                    ? `Restore login access for ${accessConfirmModal.user.email}`
                    : `Instantly terminate active sessions and block login access for ${accessConfirmModal.user.email}`}
                </p>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-left text-xs space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="text-slate-200 font-bold">{accessConfirmModal.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-cyan-400">{accessConfirmModal.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Action:</span>
                  <span className={accessConfirmModal.user.isDisabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {accessConfirmModal.user.isDisabled ? 'UNBLOCK & RESTORE' : 'REVOKE 24/7 ACTIVE SESSION'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-left leading-relaxed">
                {accessConfirmModal.user.isDisabled
                  ? 'User will be able to log back into their account and access purchased courses.'
                  : 'User will be automatically logged out across all browsers/devices within 3-4 seconds via heartbeat guard.'}
              </p>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAccessConfirmModal({ isOpen: false, user: null })}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteToggleUserAccess}
                  className={`flex-1 px-4 py-2.5 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-lg ${
                    accessConfirmModal.user.isDisabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
                  }`}
                >
                  {accessConfirmModal.user.isDisabled ? 'Confirm Restore' : 'Confirm Revoke Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
