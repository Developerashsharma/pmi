// Main JS

$(document).ready(function () {

    // Initialize AOS
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });

    // Generic Form Validation
    function validateField(field) {
        const value = $(field).val().trim();
        const type = $(field).attr('type');
        const isRequired = $(field).prop('required');
        let isValid = true;
        const tagName = $(field).prop('tagName').toLowerCase();

        // Check required
        if (isRequired) {
            if (tagName === 'select') {
                if (value === null || value === '' || value === 'Choose a service...' || value === 'Select Service') {
                    isValid = false;
                }
            } else if (value === '') {
                isValid = false;
            }
        }

        // Specific checks if not empty
        if (value !== '') {
            if (type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) isValid = false;
            } else if (type === 'tel') {
                const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10,}$/;
                if (!phoneRegex.test(value)) isValid = false;
            }
        }

        if (isValid) {
            $(field).removeClass('is-invalid').addClass('is-valid');
        } else {
            $(field).removeClass('is-valid').addClass('is-invalid');
        }
        return isValid;
    }

    // Attach Input Listeners to Forms
    $('form input, form textarea, form select').on('input blur change', function () {
        validateField(this);
    });

    // Multi-Step Form Logic (Global)
    window.nextStep = function (currentStep) {
        const currentSection = $(`#step${currentStep}`);
        let valid = true;

        // Validate inputs in current step
        currentSection.find('input, textarea, select').each(function () {
            if (!validateField(this)) {
                valid = false;
            }
        });

        if (valid) {
            // Update UI
            $(`#step${currentStep}`).removeClass('active');
            $(`#step${currentStep}-indicator`).addClass('completed').removeClass('active');

            $(`#step${currentStep + 1}`).addClass('active');
            $(`#step${currentStep + 1}-indicator`).addClass('active');
        }
    };

    window.prevStep = function (currentStep) {
        $(`#step${currentStep}`).removeClass('active');
        $(`#step${currentStep}-indicator`).removeClass('active');

        $(`#step${currentStep - 1}`).addClass('active');
        $(`#step${currentStep - 1}-indicator`).addClass('active').removeClass('completed');
    };


    // Handle Form Submission
    $('form').on('submit', function (e) {
        e.preventDefault();
        const form = $(this);
        let formIsValid = true;

        // Validate all fields
        form.find('input, textarea, select').each(function () {
            if (!validateField(this)) {
                formIsValid = false;
            }
        });

        const msgContainer = form.find('.form-message');

        if (formIsValid) {
            // Real form submission via AJAX
            const btn = form.find('button[type="submit"]');
            const originalText = btn.text();
            btn.prop('disabled', true).text('Sending...');

            // Serialize form data
            const formData = form.serialize();

            // Send to PHP handler
            $.ajax({
                url: 'send-email.php',
                type: 'POST',
                data: formData,
                dataType: 'json',
                success: function (response) {
                    btn.prop('disabled', false).text(originalText);
                    if (msgContainer.length) {
                        msgContainer.removeClass('error').addClass('success')
                            .text(response.message || 'Message sent successfully! We will contact you soon.')
                            .slideDown();
                        setTimeout(() => msgContainer.slideUp(), 5000);
                    }
                    form[0].reset();
                    form.find('.is-valid').removeClass('is-valid');
                },
                error: function (xhr) {
                    btn.prop('disabled', false).text(originalText);
                    let errorMessage = 'Sorry, there was an error sending your message. Please try again later.';

                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }

                    if (msgContainer.length) {
                        msgContainer.removeClass('success').addClass('error')
                            .text(errorMessage)
                            .slideDown();
                    }
                }
            });
        } else {
            if (msgContainer.length) {
                msgContainer.removeClass('success').addClass('error').text('Please fill all fields correctly.').slideDown();
            }
        }
    });

    // Sticky Header
    $(window).scroll(function () {
        if ($(this).scrollTop() > 100) {
            $('.navbar').addClass('fixed-top shadow');
            $('.btn-top').addClass('show');
        } else {
            $('.navbar').removeClass('fixed-top shadow');
            $('.btn-top').removeClass('show');
        }
    });

    // Back to Top
    $('.btn-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 800);
        return false;
    });

    // GSAP Animations
    if ($('.hero-title').length) {
        gsap.to(".hero-title", { duration: 1, y: 0, opacity: 1, ease: "power3.out", delay: 0.5 });
        gsap.to(".hero-subtitle", { duration: 1, y: 0, opacity: 1, ease: "power3.out", delay: 0.8 });
        gsap.to(".hero-btn", { duration: 1, y: 0, opacity: 1, ease: "power3.out", delay: 1.1 });
    }

    // Counter Animation
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        counter.innerText = '0';
        const updateCounter = () => {
            const target = +counter.getAttribute('data-target');
            const c = +counter.innerText;
            const increment = target / 200;
            if (c < target) {
                counter.innerText = `${Math.ceil(c + increment)}`;
                setTimeout(updateCounter, 20);
            } else {
                counter.innerText = target;
            }
        };

        // Trigger on scroll using Intersection Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(counter);
    });

    // Integrated Product Filtering, Sorting, and Pagination System
    if ($('.product-card').length) {
        const itemsPerPage = 9;
        let currentPage = 1;
        let allProducts = $('.col-lg-9 .row.g-4 > .col-md-4').toArray();
        let filteredProducts = [...allProducts];

        function applyFilters() {
            const searchTerm = $('#searchInput').val().toLowerCase().trim();
            const selectedCategories = [];
            $('.form-check-input:checked').each(function () {
                selectedCategories.push($(this).next('label').text().trim());
            });
            const selectedGrade = $('#gradeFilter').val();

            filteredProducts = allProducts.filter(function (product) {
                const $product = $(product);
                const title = $product.find('.card-title').text().toLowerCase();
                const description = $product.find('.card-text').text().toLowerCase();

                if (searchTerm && !title.includes(searchTerm) && !description.includes(searchTerm)) {
                    return false;
                }

                if (selectedCategories.length > 0) {
                    let matchesCategory = false;
                    selectedCategories.forEach(cat => {
                        if (cat.includes('Stainless') && (title.includes('ss ') || title.includes('stainless'))) matchesCategory = true;
                        if (cat.includes('Copper') && title.includes('copper')) matchesCategory = true;
                        if (cat.includes('Brass') && title.includes('brass')) matchesCategory = true;
                        if (cat.includes('Aluminum') && title.includes('aluminum')) matchesCategory = true;
                        if (cat.includes('Fittings') && (title.includes('flange') || title.includes('fitting') || title.includes('bolt') || title.includes('nut') || title.includes('washer') || title.includes('gasket'))) matchesCategory = true;
                    });
                    if (!matchesCategory) return false;
                }

                if (selectedGrade !== 'all' && !title.includes(selectedGrade)) {
                    return false;
                }

                return true;
            });

            applySorting();
            currentPage = 1;
            showPage(1);
        }

        function applySorting() {
            const sortValue = $('#sortSelect').val();

            if (sortValue === 'name-asc') {
                filteredProducts.sort((a, b) => {
                    const nameA = $(a).find('.card-title').text().toLowerCase();
                    const nameB = $(b).find('.card-title').text().toLowerCase();
                    return nameA.localeCompare(nameB);
                });
            } else if (sortValue === 'name-desc') {
                filteredProducts.sort((a, b) => {
                    const nameA = $(a).find('.card-title').text().toLowerCase();
                    const nameB = $(b).find('.card-title').text().toLowerCase();
                    return nameB.localeCompare(nameA);
                });
            }
        }

        function showPage(page) {
            currentPage = page;
            const totalItems = filteredProducts.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            $(allProducts).hide();

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;

            $(filteredProducts.slice(start, end)).fadeIn();

            const displayStart = totalItems > 0 ? start + 1 : 0;
            const displayEnd = Math.min(end, totalItems);
            $('#currentRange').text(`${displayStart}-${displayEnd}`);
            $('#totalProducts').text(totalItems);

            renderPagination(totalPages);

            if (page > 1) {
                $('html, body').animate({
                    scrollTop: $('.col-lg-9').offset().top - 100
                }, 400);
            }
        }

        function renderPagination(totalPages) {
            const $pagination = $('#paginationControls');
            $pagination.empty();

            if (totalPages <= 1) {
                $('#paginationNav').hide();
                return;
            }

            $('#paginationNav').show();

            const prevDisabled = currentPage === 1 ? 'disabled' : '';
            $pagination.append(`
                <li class="page-item ${prevDisabled}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}" tabindex="-1">Previous</a>
                </li>
            `);

            for (let i = 1; i <= totalPages; i++) {
                const active = i === currentPage ? 'active' : '';
                const activeClass = i === currentPage ? 'bg-secondary-custom border-secondary-custom' : 'text-dark';
                $pagination.append(`
                    <li class="page-item ${active}">
                        <a class="page-link ${activeClass}" href="#" data-page="${i}">${i}</a>
                    </li>
                `);
            }

            const nextDisabled = currentPage === totalPages ? 'disabled' : '';
            $pagination.append(`
                <li class="page-item ${nextDisabled}">
                    <a class="page-link text-dark" href="#" data-page="${currentPage + 1}">Next</a>
                </li>
            `);
        }

        $('#applyFilters').on('click', function (e) {
            e.preventDefault();
            applyFilters();
        });

        $('#searchInput').on('keyup', function (e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });

        $('.form-check-input').on('change', function () {
            applyFilters();
        });

        $('#gradeFilter').on('change', function () {
            applyFilters();
        });

        $('#sortSelect').on('change', function () {
            applySorting();
            showPage(currentPage);
        });

        $(document).on('click', '#paginationControls a', function (e) {
            e.preventDefault();
            const page = parseInt($(this).data('page'));
            const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
            if (page >= 1 && page <= totalPages) {
                showPage(page);
            }
        });

        showPage(1);
    }


    // Product Gallery Image Swap
    $('.product-gallery .col-3 img').click(function () {
        // Update main image src
        var newSrc = $(this).attr('src');
        $('#mainImage').attr('src', newSrc);

        // Update active class styling (optional but good for UX)
        $('.product-gallery .col-3 img').removeClass('border-primary-custom shadow-sm').addClass('border');
        $(this).removeClass('border').addClass('border-primary-custom shadow-sm');
    });

});

// Certificate Lightbox Functionality (Global scope for onclick handlers)
const certificates = [
    'assets/images/certificates/iso_certificate.png',
    'assets/images/certificates/msme_certificate.png',
    'assets/images/certificates/quality_award.png'
];

let currentCertificateIndex = 0;

function openLightbox(index) {
    currentCertificateIndex = index;
    const lightbox = document.getElementById('certificateLightbox');
    const lightboxImg = document.getElementById('lightboxImg');

    lightboxImg.src = certificates[currentCertificateIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent body scroll
}

function closeLightbox() {
    const lightbox = document.getElementById('certificateLightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restore body scroll
}

function changeCertificate(direction) {
    currentCertificateIndex += direction;

    // Loop around
    if (currentCertificateIndex >= certificates.length) {
        currentCertificateIndex = 0;
    } else if (currentCertificateIndex < 0) {
        currentCertificateIndex = certificates.length - 1;
    }

    const lightboxImg = document.getElementById('lightboxImg');
    lightboxImg.src = certificates[currentCertificateIndex];
}

// Keyboard navigation
document.addEventListener('keydown', function (e) {
    const lightbox = document.getElementById('certificateLightbox');
    if (lightbox && lightbox.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            changeCertificate(-1);
        } else if (e.key === 'ArrowRight') {
            changeCertificate(1);
        }
    }
});

// Close lightbox when clicking outside the image
document.addEventListener('DOMContentLoaded', function () {
    const lightbox = document.getElementById('certificateLightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }
});
