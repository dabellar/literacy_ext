"use strict";
/**
 * @author Darleine Abellard
 * CS 141 - Reader's Aide Chrome Extension
 *
 * The JS file for the side panel of the reading helper chrome extension. 
 * This file handles the functionality of the side panel, 
 * including word lookup and word-of-the-day popup features.
 */

(function() {
    /**
     * Initialize the side panel
     */
    function init() {
        // initialize speech recognition functionality
        initSpeechRecognition();
        
        // context menu search if the side panel is closed
        getPendingSearch();
        // context search menu if the side panel is open
        chrome.runtime.onMessage.addListener((request) => {
            if (request.action === "contextSearch" && request.word) {
                document.getElementById("word-input").value = request.word;
                getDefinition();
            }
        });
        
        // toggle info tooltip
        const infoBtn = document.getElementById("infoBtn");
        infoBtn.addEventListener("click", toggleInfo);

        // get definition(s) of the word
        const defineBtn = document.getElementById("ra-lookupBtn");
        defineBtn.addEventListener("click", getDefinition);
        // listen for enter key press in the word input
        const wordInput = document.getElementById("word-input");
        wordInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                getDefinition();
            }
        });

        // speak the word
        const speakBtn = document.getElementById("ra-speakBtn");
        speakBtn.addEventListener("click", speakWord);

        // practice saying the word
        const practiceBtn = document.getElementById("ra-practiceBtn");
        practiceBtn.addEventListener("click", toggleRecording);
    }

    
    function toggleInfo() {
        const infoTooltip = document.getElementById("info-tooltip");
        const infoBtn = document.getElementById("infoBtn");
        infoTooltip.classList.toggle("hidden");
    }

    /**
     * Speak the word aloud
     */
    function speakWord() {
        const word = document.getElementById("word-input").value.trim();
        if (!word) return;

        chrome.runtime.sendMessage({ action: "speakWord", word: word });
    }

    /**
     * Initialize speech recognition functionality
     */
    function initSpeechRecognition() {
        // check mic permission status
        checkPermissionStatus();
        // set up permission monitoring
        startPermissionMonitoring(); 
    }

    /**
     * Toggle speech recognition recording 
     * when clicking button
     */
    function toggleRecording() {
        if (speechRecognitionState.getIsRecording()) {
            stopRecording();
        } else {
            startRecording();
        }
    }
    

    init();
})();
