"use strict";
/**
 * @author Darleine Abellard
 * CS 141 - Reader's Aide Chrome Extension
 *
 * This module contains helper functions for the side panel
 */


/**
 * Generate a definition element
 * @param {string} pOS - part of speech
 * @param {string} definition - the definition text
 * @returns {HTMLElement} - the generated definition element
 */
function genDefinition(pOS, definition) {
    const p = document.createElement("p");
    p.className = "ra-definition";
    const span = document.createElement("span");
    span.textContent = `(${pOS}.) `;
    p.appendChild(span);
    p.appendChild(document.createTextNode(definition));
    return p;
}

/**
 * Generate a speech recognition element
 * @param {string} message - the message text
 */
function genSpeechRecognition(message) {
    const feedbackBucket = document.getElementById("ra-feedback-bucket");
    removeFeedback();
    const p = document.createElement("p");
    p.textContent = message;
    feedbackBucket.appendChild(p);
    feedbackBucket.classList.remove("hidden");
}

/**
 * Remove the current definition from the display
 */
function removeDefinition() {
    const definitionBucket = document.getElementById("ra-definition-bucket");
    while (definitionBucket.firstChild) {
        definitionBucket.removeChild(definitionBucket.firstChild);
    }
}

/**
 * Remove the current feedback from the display
 */
function removeFeedback() {
    const feedbackBucket = document.getElementById("ra-feedback-bucket");
    while (feedbackBucket.firstChild) {
        feedbackBucket.removeChild(feedbackBucket.firstChild);
    }
    feedbackBucket.classList.add("hidden");
}