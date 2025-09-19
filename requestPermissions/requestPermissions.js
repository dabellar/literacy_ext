/**
 * @author Darleine Abellard
 * CS 141 - Reader's Aide Chrome Extension
 *
 * This JS file for the temporary webpage for the microphone permissions request
 * for the Reader's Aide Chrome Extension.
 */

(function() {
    /**
     * Initialize the microphone permission request.
     */
    function init() {
        const requestBtn = document.getElementById('requestBtn');
        if (requestBtn) {
            requestBtn.addEventListener('click', getUserPermission);
        }
    }

    /**
     * Requests user permission for microphone access.
     * @returns {Promise<void>} A Promise that resolves when permission is granted or rejects with an error.
     */
    async function getUserPermission() {
        console.log("Getting user permission for microphone access...");
        const statusElement = document.getElementById('statusMessage');
        
        try {
            statusElement.textContent = "Requesting microphone access...";
            statusElement.className = "status";
            
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Stop all tracks to release the microphone
            stream.getTracks().forEach(track => track.stop());
            
            // Check the permission status
            const micPermission = await navigator.permissions.query({
            name: "microphone",
            });
            
            if (micPermission.state === "granted") {
            statusElement.textContent = "Microphone access granted! You can close this tab.";
            statusElement.className = "status granted";
            
            // Notify the service worker that permission has been granted
            chrome.runtime.sendMessage({ type: "permissionGranted" });
            
            // Close the tab after a short delay
            setTimeout(() => {
                window.close();
            }, 2000);
            } else {
            statusElement.textContent = "Permission not granted. Please allow microphone access.";
            statusElement.className = "status denied";
            }
        } catch (error) {
            console.error("Error getting microphone permission:", error);
            statusElement.textContent = "Error: " + error.message;
            statusElement.className = "status denied";
        }
    }

    init();
})();