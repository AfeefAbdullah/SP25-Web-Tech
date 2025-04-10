document.addEventListener('DOMContentLoaded', function() {
    // Select all view buttons
    const viewButtons = document.querySelectorAll('.view-btn');
    
    // Add click event listener to each button
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the path from the data-path attribute
            const path = this.getAttribute('data-path');
            
            // Update the iframe source
            const iframe = document.getElementById('content-frame');
            iframe.src = path;
            
            // Highlight the active button
            viewButtons.forEach(btn => btn.style.backgroundColor = '#3498db');
            this.style.backgroundColor = '#16a085';
        });
    });
});
