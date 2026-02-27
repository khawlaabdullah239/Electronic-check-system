import React, { useState, useEffect, useRef } from 'react';
import { QrCode, FileText, CheckCircle, Shield, Download, Printer, Search, AlertCircle, User, Building2, Calendar, DollarSign, Hash, Lock, Eye, EyeOff, Github, Settings } from 'lucide-react';

// Sudanese Banks List
const SUDANESE_BANKS = [
  'بنك الخرطوم',
  'بنك فيصل الإسلامي السوداني',
  'بنك أم درمان الوطني',
  'بنك النيلين',
  'بنك السودان المركزي',
  'المصرف الصناعي السوداني',
  'بنك المزارع التجاري',
  'بنك الإدخار والتنمية الاجتماعية',
  'بنك البركة السوداني',
  'بنك التضامن الإسلامي',
  'بنك الثروة الحيوانية والتعاوني',
  'بنك الإستثمار السوداني',
  'بنك التنمية التعاوني الإسلامي',
  'بنك قطر الوطني - السودان',
  'بنك أبو ظبي الإسلامي - السودان'
];

// Student names
const STUDENTS = [
  'خولة عبدالله الطيب',
  'رنا صلاح محمد علي',
  'فداء فتح الرحمن اسحق',
  'نون عبدالرحيم عبيد'
];

// Number to Arabic Words Conversion (Standard Formal Arabic for banking)
const numberToArabicWords = (num) => {
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  
  if (num === 0) return 'صفر';
  
  let result = '';
  const number = Math.floor(num);
  
  if (number >= 1000000) {
    const millions = Math.floor(number / 1000000);
    if (millions === 1) result += 'مليون ';
    else if (millions === 2) result += 'مليونان ';
    else if (millions <= 10) result += numberToArabicWords(millions) + ' ملايين ';
    else result += numberToArabicWords(millions) + ' مليون ';
    
    const remainder = number % 1000000;
    if (remainder > 0) {
      result += 'و' + numberToArabicWords(remainder);
    }
    return result;
  }
  
  if (number >= 1000) {
    const thousands = Math.floor(number / 1000);
    if (thousands === 1) result += 'ألف ';
    else if (thousands === 2) result += 'ألفان ';
    else if (thousands <= 10) result += numberToArabicWords(thousands) + ' آلاف ';
    else result += numberToArabicWords(thousands) + ' ألف ';
    
    const remainder = number % 1000;
    if (remainder > 0) {
      result += 'و' + numberToArabicWords(remainder);
    }
    return result;
  }
  
  if (number >= 100) {
    result += hundreds[Math.floor(number / 100)];
    const remainder = number % 100;
    if (remainder > 0) {
      result += ' و' + numberToArabicWords(remainder);
    }
    return result;
  }
  
  if (number >= 20) {
    result += tens[Math.floor(number / 10)];
    const remainder = number % 10;
    if (remainder > 0) {
      result += ' و' + ones[remainder];
    }
    return result;
  }
  
  if (number >= 10) {
    return teens[number - 10];
  }
  
  return ones[number];
};

// Generate SHA-256 hash
const generateHash = async (data) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const ElectronicCheckSystem = () => {
  const [activeTab, setActiveTab] = useState('issue');
  const [checks, setChecks] = useState([]);
  const [showPin, setShowPin] = useState(false);
  const qrContainerRef = useRef(null);
  const verifyQrRef = useRef(null);
  
  // Issue Check State
  const [checkData, setCheckData] = useState({
    checkNumber: '',
    issuerName: '',
    issuerAccount: '',
    beneficiaryName: '',
    amount: '',
    amountInWords: '',
    issueDate: new Date().toISOString().split('T')[0],
    bankName: '',
    branchName: '',
    securityPin: ''
  });
  
  const [generatedCheck, setGeneratedCheck] = useState(null);
  const [verifyNumber, setVerifyNumber] = useState('');
  const [verifyPin, setVerifyPin] = useState('');
  const [verifiedCheck, setVerifiedCheck] = useState(null);
  
  // Load checks from memory
  useEffect(() => {
    const savedChecks = JSON.parse(localStorage.getItem('sudaneseElectronicChecks') || '[]');
    setChecks(savedChecks);
  }, []);
  
  // Update amount in words when amount changes
  useEffect(() => {
    if (checkData.amount && !isNaN(checkData.amount)) {
      const words = numberToArabicWords(parseFloat(checkData.amount));
      setCheckData(prev => ({ ...prev, amountInWords: words + ' جنيه سوداني' }));
    }
  }, [checkData.amount]);
  
  const handleInputChange = (field, value) => {
    setCheckData(prev => ({ ...prev, [field]: value }));
  };
  
  const generateQRCode = async (data, container) => {
    if (!container) return;
    
    try {
      container.innerHTML = '';
      
      if (!window.QRious) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);
      
      new window.QRious({
        element: canvas,
        value: data,
        size: 250,
        background: 'white',
        foreground: '#1e293b',
        level: 'H'
      });
      
      canvas.className = 'w-full h-auto rounded-lg';
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };
  
  const issueCheck = async () => {
    // Validation
    if (!checkData.checkNumber || !checkData.issuerName || !checkData.issuerAccount || 
        !checkData.beneficiaryName || !checkData.amount || !checkData.bankName || 
        !checkData.securityPin) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }
    
    if (checkData.securityPin.length !== 4 || isNaN(checkData.securityPin)) {
      alert('رمز الأمان يجب أن يكون 4 أرقام');
      return;
    }
    
    const timestamp = new Date().toISOString();
    const checkString = JSON.stringify({ ...checkData, timestamp });
    const signature = await generateHash(checkString + checkData.securityPin);
    
    const newCheck = {
      ...checkData,
      timestamp,
      signature,
      status: 'active',
      id: Date.now()
    };
    
    const qrData = JSON.stringify({
      checkNumber: newCheck.checkNumber,
      signature: newCheck.signature,
      timestamp: newCheck.timestamp,
      country: 'Sudan'
    });
    
    setGeneratedCheck(newCheck);
    
    // Save to memory
    const updatedChecks = [...checks, newCheck];
    setChecks(updatedChecks);
    localStorage.setItem('sudaneseElectronicChecks', JSON.stringify(updatedChecks));
    
    // Generate QR Code
    setTimeout(() => {
      if (qrContainerRef.current) {
        generateQRCode(qrData, qrContainerRef.current);
      }
    }, 100);
  };
  
  const verifyCheck = async () => {
    if (!verifyNumber || !verifyPin) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }
    
    const check = checks.find(c => c.checkNumber === verifyNumber);
    
    if (!check) {
      alert('الشيك غير موجود');
      setVerifiedCheck({ isValid: false });
      return;
    }
    
    // Simple PIN verification
    const isValid = check.securityPin === verifyPin;
    
    if (isValid) {
      setVerifiedCheck({
        ...check,
        isValid: true,
        verifiedAt: new Date().toISOString()
      });
      
      // Generate QR for verification
      setTimeout(() => {
        if (verifyQrRef.current) {
          const qrData = JSON.stringify({
            checkNumber: check.checkNumber,
            signature: check.signature,
            timestamp: check.timestamp,
            country: 'Sudan'
          });
          generateQRCode(qrData, verifyQrRef.current);
        }
      }, 100);
    } else {
      alert('رمز الأمان غير صحيح');
      setVerifiedCheck({ isValid: false });
    }
  };
  
  const downloadCheckPDF = () => {
    alert('سيتم تطوير ميزة التحميل كـ PDF في المرحلة القادمة من المشروع');
  };
  
  const printCheck = () => {
    window.print();
  };
  
  const clearForm = () => {
    setCheckData({
      checkNumber: '',
      issuerName: '',
      issuerAccount: '',
      beneficiaryName: '',
      amount: '',
      amountInWords: '',
      issueDate: new Date().toISOString().split('T')[0],
      bankName: '',
      branchName: '',
      securityPin: ''
    });
    setGeneratedCheck(null);
  };
  
  const getTotalAmount = () => {
    return checks.reduce((sum, check) => sum + parseFloat(check.amount || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <QrCode className="w-12 h-12" />
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">نظام الشيك الإلكتروني</h1>
              <p className="text-blue-100 text-lg">تحويل الشيك الورقي إلى شيك إلكتروني بتقنية QR</p>
              <p className="text-blue-200 text-sm mt-2">مشروع تخرج - كلية شرق النيل</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex justify-center gap-4 mt-8">
            {[
              { id: 'issue', label: 'إصدار شيك', icon: FileText },
              { id: 'verify', label: 'التحقق من شيك', icon: Search },
              { id: 'history', label: 'سجل الشيكات', icon: CheckCircle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-900 shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Issue Check Tab */}
        {activeTab === 'issue' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <FileText className="w-7 h-7 text-blue-600" />
                إصدار شيك
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      رقم الشيك *
                    </label>
                    <div className="relative">
                      <Hash className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={checkData.checkNumber}
                        onChange={(e) => handleInputChange('checkNumber', e.target.value)}
                        placeholder="أدخل رقم الشيك"
                        className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      تاريخ الإصدار *
                    </label>
                    <input
                      type="date"
                      value={checkData.issueDate}
                      onChange={(e) => handleInputChange('issueDate', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم المصدر *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={checkData.issuerName}
                      onChange={(e) => handleInputChange('issuerName', e.target.value)}
                      placeholder="الاسم الكامل للمصدر"
                      className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رقم حساب المصدر *
                  </label>
                  <input
                    type="text"
                    value={checkData.issuerAccount}
                    onChange={(e) => handleInputChange('issuerAccount', e.target.value)}
                    placeholder="رقم الحساب البنكي"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم المستفيد *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={checkData.beneficiaryName}
                      onChange={(e) => handleInputChange('beneficiaryName', e.target.value)}
                      placeholder="الاسم الكامل للمستفيد"
                      className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    المبلغ *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={checkData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="المبلغ بالجنيه السوداني"
                      className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    المبلغ بالحروف
                  </label>
                  <input
                    type="text"
                    value={checkData.amountInWords}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      اسم البنك *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                      <select
                        value={checkData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        className="w-full pr-10 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">اختر البنك</option>
                        {SUDANESE_BANKS.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      اسم الفرع
                    </label>
                    <input
                      type="text"
                      value={checkData.branchName}
                      onChange={(e) => handleInputChange('branchName', e.target.value)}
                      placeholder="فرع البنك"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رمز الأمان (4 أرقام) *
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type={showPin ? "text" : "password"}
                      value={checkData.securityPin}
                      onChange={(e) => handleInputChange('securityPin', e.target.value.slice(0, 4))}
                      placeholder="أدخل رمز أمان مكون من 4 أرقام"
                      maxLength={4}
                      className="w-full pr-10 pl-12 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 z-10"
                    >
                      {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={issueCheck}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg"
                  >
                    <CheckCircle className="w-5 h-5" />
                    إصدار الشيك
                  </button>
                  
                  <button
                    onClick={clearForm}
                    className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                  >
                    مسح النموذج
                  </button>
                </div>
              </div>
            </div>
            
            {/* Generated Check Display */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Shield className="w-7 h-7 text-blue-600" />
                الشيك الإلكتروني
              </h2>
              
              {generatedCheck ? (
                <div className="space-y-6">
                  {/* Check Preview */}
                  <div className="border-4 border-blue-600 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-bold text-blue-900">{generatedCheck.bankName}</h3>
                      <p className="text-sm text-gray-600">{generatedCheck.branchName}</p>
                      <p className="text-xs text-gray-500 mt-1">🇸🇩 السودان</p>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold">رقم الشيك:</span>
                        <span className="font-mono">{generatedCheck.checkNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">التاريخ:</span>
                        <span>{generatedCheck.issueDate}</span>
                      </div>
                      <div className="border-t-2 border-dashed border-gray-300 pt-3">
                        <p className="font-semibold mb-2">ادفعوا لأمر:</p>
                        <p className="text-lg font-bold text-blue-900">{generatedCheck.beneficiaryName}</p>
                      </div>
                      <div className="border-t-2 border-dashed border-gray-300 pt-3">
                        <p className="font-semibold mb-2">مبلغ وقدره:</p>
                        <p className="text-2xl font-bold text-blue-700">{parseFloat(generatedCheck.amount).toLocaleString()} جنيه سوداني</p>
                        <p className="text-sm text-gray-600 mt-1">{generatedCheck.amountInWords}</p>
                      </div>
                      <div className="border-t-2 border-dashed border-gray-300 pt-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">اسم المصدر:</p>
                            <p>{generatedCheck.issuerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">رقم الحساب:</p>
                            <p className="font-mono text-sm">{generatedCheck.issuerAccount}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <h3 className="font-bold text-gray-800 mb-4">رمز QR للتحقق</h3>
                    <div ref={qrContainerRef} className="flex justify-center mb-4"></div>
                    <p className="text-xs text-gray-500">امسح هذا الرمز للتحقق من صحة الشيك</p>
                  </div>
                  
                  {/* Digital Signature */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1">التوقيع الرقمي (SHA-256):</p>
                    <p className="text-xs font-mono text-gray-600 break-all">{generatedCheck.signature}</p>
                  </div>
                  
                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={downloadCheckPDF}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold"
                    >
                      <Download className="w-5 h-5" />
                      تحميل كـ PDF
                    </button>
                    
                    <button
                      onClick={printCheck}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
                    >
                      <Printer className="w-5 h-5" />
                      طباعة الشيك
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">تم إصدار الشيك بنجاح</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <QrCode className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">املأ النموذج لإصدار شيك إلكتروني</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Verify Check Tab */}
        {activeTab === 'verify' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Verify Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Search className="w-7 h-7 text-blue-600" />
                التحقق من شيك
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رقم الشيك *
                  </label>
                  <input
                    type="text"
                    value={verifyNumber}
                    onChange={(e) => setVerifyNumber(e.target.value)}
                    placeholder="أو أدخل رقم الشيك"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رمز الأمان *
                  </label>
                  <input
                    type="password"
                    value={verifyPin}
                    onChange={(e) => setVerifyPin(e.target.value.slice(0, 4))}
                    placeholder="أدخل رمز الأمان"
                    maxLength={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={verifyCheck}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg"
                >
                  <Search className="w-5 h-5" />
                  التحقق من الشيك
                </button>
              </div>
            </div>
            
            {/* Verification Result Display */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Shield className="w-7 h-7 text-blue-600" />
                نتيجة التحقق
              </h2>
              
              {verifiedCheck ? (
                <div className="space-y-6">
                  <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                    verifiedCheck.isValid 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-red-50 border-red-500 text-red-700'
                  }`}>
                    {verifiedCheck.isValid ? (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-bold text-lg">تم التحقق بنجاح</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6" />
                        <span className="font-bold text-lg">شيك غير صالح</span>
                      </>
                    )}
                  </div>
                  
                  {verifiedCheck.isValid && (
                    <>
                      <div className="border-4 border-blue-500 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">تفاصيل الشيك</h3>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">رقم الشيك:</span>
                            <span className="font-mono">{verifiedCheck.checkNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">التاريخ:</span>
                            <span>{verifiedCheck.issueDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">المصدر:</span>
                            <span>{verifiedCheck.issuerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">المستفيد:</span>
                            <span>{verifiedCheck.beneficiaryName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">البنك:</span>
                            <span>{verifiedCheck.bankName}</span>
                          </div>
                          <div className="flex justify-between border-t-2 border-gray-200 pt-3">
                            <span className="font-semibold text-gray-700">المبلغ:</span>
                            <span className="text-lg font-bold text-blue-700">{parseFloat(verifiedCheck.amount).toLocaleString()} جنيه سوداني</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t-2 border-gray-200">
                          <p className="font-semibold text-gray-700 mb-2">المبلغ بالحروف:</p>
                          <p className="text-gray-600">{verifiedCheck.amountInWords}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <h3 className="font-bold text-gray-800 mb-4">رمز QR</h3>
                        <div ref={verifyQrRef} className="flex justify-center"></div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Search className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">أدخل بيانات الشيك للتحقق منه</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 mb-2">إجمالي الشيكات</p>
                    <p className="text-4xl font-bold">{checks.length}</p>
                  </div>
                  <FileText className="w-12 h-12 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 mb-2">المبلغ الإجمالي</p>
                    <p className="text-3xl font-bold">{getTotalAmount().toLocaleString()}</p>
                    <p className="text-indigo-100 text-sm">جنيه سوداني</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-indigo-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-100 mb-2">الشيكات النشطة</p>
                    <p className="text-4xl font-bold">{checks.filter(c => c.status === 'active').length}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-cyan-200" />
                </div>
              </div>
            </div>
            
            {/* Checks List */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">الشيكات الأخيرة</h2>
              
              {checks.length > 0 ? (
                <div className="space-y-4">
                  {checks.slice().reverse().map(check => (
                    <div key={check.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all duration-200">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">رقم الشيك</p>
                          <p className="font-mono font-bold">{check.checkNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">المستفيد</p>
                          <p className="font-semibold">{check.beneficiaryName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">المبلغ</p>
                          <p className="font-bold text-blue-600">{parseFloat(check.amount).toLocaleString()} جنيه سوداني</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">التاريخ</p>
                          <p>{check.issueDate}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">البنك: <span className="font-semibold text-gray-700">{check.bankName}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد شيكات</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Project Info */}
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                معلومات المشروع
              </h3>
              <div className="space-y-3 text-sm flex-1">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">الجامعة</p>
                  <p className="font-semibold">كلية شرق النيل</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">القسم</p>
                  <p className="font-semibold">قسم تقانة المعلومات</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">المشرف</p>
                  <p className="font-semibold">أ/ محمد صالح</p>
                </div>
              </div>
            </div>
            
            {/* Students */}
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
                <User className="w-6 h-6" />
                الطالبات
              </h3>
              <div className="space-y-2 text-sm flex-1">
                {STUDENTS.map((student, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="font-semibold">{student}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* System Features */}
            <div className="flex flex-col h-full">
              <h3 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                مميزات النظام
              </h3>
              <div className="space-y-3 text-sm flex-1">
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  <span>نظام آمن ومشفر</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <Lock className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                  <span>تشفير SHA-256</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <QrCode className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                  <span>تقنية QR المتقدمة</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  <span>تحقق فوري</span>
                </div>
              </div>
              
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all duration-200 justify-center"
              >
                <Github className="w-5 h-5" />
                <span className="text-sm font-semibold">المشروع على GitHub</span>
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 نظام الشيك الإلكتروني بتقنية QR
            </p>
            <p className="text-gray-500 text-xs mt-2">
              مشروع تخرج - كلية شرق النيل
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectronicCheckSystem;
