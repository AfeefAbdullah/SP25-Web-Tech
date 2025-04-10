$(document).ready(function() {
    // Close the top banner
    $('.close-banner').on('click', function() {
        $('.top-banner').fadeOut();
    });
    
    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Initialize carousel
    $('#heroCarousel').carousel({
        interval: 5000,
        ride: 'carousel'
    });
});