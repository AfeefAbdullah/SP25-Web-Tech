document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('checkoutForm');
    const successMessage = document.getElementById('successMessage');
    
    // Set default min value for expiry date (current month)
    const expiryDateInput = document.getElementById('expiryDate');
    const today = new Date();
    const year = today.getFullYear();
    let month = today.getMonth() + 1;
    month = month < 10 ? '0' + month : month;
    expiryDateInput.min = `${year}-${month}`;
    
    // Validate specific fields
    function validateFullName() {
        const fullName = document.getElementById('fullName');
        const error = document.getElementById('fullNameError');
        const regex = /^[A-Za-z ]+$/;
        
        if (!fullName.value.trim() || !regex.test(fullName.value)) {
            fullName.classList.add('input-error');
            error.classList.add('show-error');
            return false;
        } else {
            fullName.classList.remove('input-error');
            error.classList.remove('show-error');
            return true;
        }
    }
    
    function validateEmail() {
        const email = document.getElementById('email');
        const error = document.getElementById('emailError');
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email.value.trim() || !regex.test(email.value)) {
            email.classList.add('input-error');
            error.classList.add('show-error');
            return false;
        } else {
            email.classList.remove('input-error');
            error.classList.remove('show-error');
            return true;
        }
    }
    
    function validatePhone() {
        const phone = document.getElementById('phone');
        const error = document.getElementById('phoneError');
        const regex = /^[0-9]{10,15}$/;
        
        if (!phone.value.trim() || !regex.test(phone.value)) {
            phone.classList.add('input-error');
            error.classList.add('show-error');
            return false;
        } else {
            phone.classList.remove('input-error');
            error.classList.remove('show-error');
            return true;
        }
    }
    
    function validateAddress() {
        const address = document.getElementById('address');
        const error = document.getElementById('addressError');
        
        if (!address.value.trim()) {
            address.classList.add('input-error');
            error.classList.add('show-error');
            return false;
        } else {
            address.classList.remove('input-error');
            error.classList.remove('show-error');
            return true;
        }
    }
    
    function validateCardNumber() {
        const cardNumber = document.getElementById('cardNumber');
        const error = document.getElementById('cardNumberError');
        const regex = /^[0-9]{16}$/;
        
        if (!cardNumber.value.trim() || !regex.test(cardNumber.value)) {
            cardNumber.classList.add('input-error');
            error.classList.add('show-error');
            return false;
        } else {
            cardNumber.classList.remove('input-error');
            error.classList.remove('show-error');
            return true;
        }
    }
    
    function validateExpiryDate() {
        const expiryDate = document.getElementById('expiryDate');
        const error = document.getElementById('expiryDateError');
        
        if (!expiryDate.value) {
            expiryDate.classList.add('input-error');
            error.classList.add('show-error');
            return false;
        }
        
        const [year, month] = expiryDate.value.split('-');
        const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const currentDate = new Date();
        const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        if (selectedDate < today) {
            expiryDate.classList.add('input-error');
            error.classList.add('show-error');
            return false;
        } else {
            expiryDate.classList.remove('input-error');
            error.classList.remove('show-error');
            return true;
        }
    }
    
    function validateCVV() {
        const cvv = document.getElementById('cvv');
        const error = document.getElementById('cvvError');
        const regex = /^[0-9]{3}$/;
        
        if (!cvv.value.trim() || !regex.test(cvv.value)) {
            cvv.classList.add('input-error');
            error.classList.add('show-error');
            return false;
        } else {
            cvv.classList.remove('input-error');
            error.classList.remove('show-error');
            return true;
        }
    }
    
    // Form submission handler
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const isFullNameValid = validateFullName();
        const isEmailValid = validateEmail();
        const isPhoneValid = validatePhone();
        const isAddressValid = validateAddress();
        const isCardNumberValid = validateCardNumber();
        const isExpiryDateValid = validateExpiryDate();
        const isCVVValid = validateCVV();
        
        if (isFullNameValid && isEmailValid && isPhoneValid && isAddressValid && 
            isCardNumberValid && isExpiryDateValid && isCVVValid) {
            
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                form.reset();
                form.style.display = 'block';
                successMessage.style.display = 'none';
            }, 3000);
        }
    });
    
    // Real-time validation during input
    document.getElementById('fullName').addEventListener('input', validateFullName);
    document.getElementById('email').addEventListener('input', validateEmail);
    document.getElementById('phone').addEventListener('input', validatePhone);
    document.getElementById('address').addEventListener('input', validateAddress);
    document.getElementById('cardNumber').addEventListener('input', validateCardNumber);
    document.getElementById('expiryDate').addEventListener('input', validateExpiryDate);
    document.getElementById('cvv').addEventListener('input', validateCVV);
});
