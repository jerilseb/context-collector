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

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    showToast("Collection Started, use Hotkey to add content", 1500);
})();