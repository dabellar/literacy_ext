"use strict";
/**
 * @author Darleine Abellard
 * CS 141 - Reader's Aide Chrome Extension
 *
 * This module handles speech recognition functionality
 */

/**
 * Private speech recognition module
 */
const speechRecognitionState = (function() {
    let recognition;
    let isRecording = false;
    let permissionCheckInterval;
    let hasRequestedPermission = false;
    let finalTranscript = '';

    return {
        /** Get the speech recognition object */
        getRecognition: () => recognition,
        /** Set the speech recognition object */
        setRecognition: (value) => { recognition = value; },
        /** Get the current recording state */
        getIsRecording: () => isRecording,
        /** Set the current recording state */
        setIsRecording: (value) => { isRecording = value; },
        /** Get the permission check interval */
        getPermissionCheckInterval: () => permissionCheckInterval,
        /** Set the permission check interval */
        setPermissionCheckInterval: (value) => { permissionCheckInterval = value; },
        /** Get the has requested permission state */
        getHasRequestedPermission: () => hasRequestedPermission,
        /** Set the has requested permission state */
        setHasRequestedPermission: (value) => { hasRequestedPermission = value; },
        /** Get the final transcript */
        getFinalTranscript: () => finalTranscript,
        /** Set the final transcript */
        setFinalTranscript: (value) => { finalTranscript = value; },
        /** Reset the transcript */
        resetTranscript: () => { finalTranscript = ''; }
    };
})();

/**
 * Check microphone permission status
 */
async function checkPermissionStatus() {
    try {
        // use the context_scripts to check permission
        const response = await sendCheckPermission();
        if (response.status == 'error') {
            throw new Error(response.error);
        }
        updateUIForPermissionState(response.status);

    } catch (err) {
        console.error('Error checking microphone permission status:', err);
    }
}

/**
 * Start permission monitoring
 */
function startPermissionMonitoring() {
    // Check permission status every 10 seconds
    const intervalId = setInterval(async () => {
        try {
            const response = await sendCheckPermission();
            if (response.status !== 'error') {
                updateUIForPermissionState(response.status);
            }
        } catch (error) {
            console.error('Error checking permission:', error);
        }
    }, 10000);
    
    speechRecognitionState.setPermissionCheckInterval(intervalId);
}

/**
 * Update UI based on permission state
 */
async function updateUIForPermissionState(state) {
    const practiceBtn = document.getElementById('ra-practiceBtn');
    
    if (state === 'granted') {
        // Reset the flag when permission is granted
        speechRecognitionState.setHasRequestedPermission(false);
        
        // Initialize speech recognition if available
        if ('webkitSpeechRecognition' in window) {
            practiceBtn.title = "Click to practice pronunciation";
        } else {
            practiceBtn.title = "Speech recognition not supported in your browser";
            practiceBtn.disabled = true;
        }
    } else if (state === 'prompt') {
        practiceBtn.title = "Microphone access needed for pronunciation practice";
        
        // Only request permission if we haven't already
        if (!speechRecognitionState.getHasRequestedPermission()) {
            speechRecognitionState.setHasRequestedPermission(true);
            // Use the service worker to open the permissions request page
            const response = await sendRequestMicPermission();
        } else {
            practiceBtn.title = "Microphone access denied. Click to try again.";
        }
    }
}

/**
 * Update practice button appearance
 */
function updatePracticeButton() {
    const practiceBtn = document.getElementById('ra-practiceBtn');
    
    if (speechRecognitionState.getIsRecording()) {
        practiceBtn.classList.add('recording');
        practiceBtn.classList.add('recording-indicator');
        practiceBtn.title = "Click to stop recording";
    } else {
        practiceBtn.classList.remove('recording');
        practiceBtn.classList.remove('recording-indicator');
        practiceBtn.title = "Click to practice pronunciation";
    }
}

 /**
 * Initialize speech recognition
 */
function initializeSpeechRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        speechRecognitionState.setIsRecording(true);
        updatePracticeButton();
        genSpeechRecognition("Listening... Say the word to practice pronunciation.");
        speechRecognitionState.resetTranscript();
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                speechRecognitionState.setFinalTranscript(transcript);
            } else {
                interimTranscript = transcript;
            }
        }

        if (interimTranscript) {
            genSpeechRecognition(`Listening...: ${interimTranscript}`);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        genSpeechRecognition(`Error: ${event.error}`);
        stopRecording();
    };

    recognition.onend = () => {
        if (speechRecognitionState.getIsRecording()) {
            stopRecording();
        }
    };

    speechRecognitionState.setRecognition(recognition);
}

/**
 * Start speech recognition recording
 * @returns {Null}
 */
function startRecording() {
    if (speechRecognitionState.getIsRecording()) return;

    // check if we have a word to practice
    let word = document.getElementById("word-input").value.trim();
    if (!word) {
        genSpeechRecognition("Please enter a word first to practice your pronunciation.");
        return;
    }

    try {
        if (!speechRecognitionState.getRecognition()) {
            initializeSpeechRecognition();
        }
        speechRecognitionState.getRecognition().start();
    } catch (err) {
        genSpeechRecognition(`Error: ${err.message}`);
    }
}

/**
 * Stop speech recognition recording
 * @returns {Null}
 */
function stopRecording() {
    if (!speechRecognitionState.getIsRecording()) return;

    speechRecognitionState.setIsRecording(false);

    // properly stop the recognition
    try {
        speechRecognitionState.getRecognition().onend = null;
        speechRecognitionState.getRecognition().stop();
    } catch (err) {
        console.error('Error stopping speech recognition:', err);
    }

    // update UI
    updatePracticeButton();

    // show feedback
    const word = document.getElementById("word-input").value.trim();
    if (speechRecognitionState.getFinalTranscript().toLowerCase() === word.toLowerCase()) {
        genSpeechRecognition("Great job! Your pronunciation is correct.");
    } else {
        genSpeechRecognition(`It sounded like you said "${speechRecognitionState.getFinalTranscript()}". Try saying "${word}" again.`);
    }
}

