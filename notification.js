(function () {
    function showToast(message, duration = 1000) {
        const toast = document.createElement('div');
        toast.textContent = message;

        toast.style.position = 'fixed';
        toast.style.fontSize = '14px';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(13, 119, 151)';
        toast.style.color = 'white';
        toast.style.padding = '15px 30px';
        toast.style.borderRadius = '5px';
        toast.style.zIndex = '9999';
        toast.style.opacity = '1';
        toast.style.transition = 'opacity 0.5s ease-out';

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, duration);
    }

    showToast("Collection Started, use Hotkey to add content", 1500);
})();