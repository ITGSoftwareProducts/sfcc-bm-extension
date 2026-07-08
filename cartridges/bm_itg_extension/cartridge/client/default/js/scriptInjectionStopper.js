(() => {
    let changeCount = 0;

    const observerTimeout = 15000;
    const observerLoadGracePeriod = 3000;
    const customModuleWrapperSelector = '.customModule-wrapper';
    const nonHeaderSelector = '.customModule-nonheader';
    const nonHeaderClasses = ['slds-grid', 'slds-col', 'slds-is-relative'];
    const blockedScriptPaths = ['/prototype.js', '/prototype_window/window.js'];

    const isElement = (node) => node && node.nodeType === Node.ELEMENT_NODE;

    const isBlockedScript = (element) => (
        isElement(element)
        && element.tagName === 'SCRIPT'
        && element.src
        && blockedScriptPaths.some((path) => element.src.includes(path))
    );

    const removeBlockedScript = (scriptElement) => {
        if (scriptElement.parentNode) {
            scriptElement.parentNode.removeChild(scriptElement);
            removedScriptCount++;
        }
    };

    const removeBlockedScripts = (root) => {
        if (!root) {
            return;
        }

        if (isBlockedScript(root)) {
            removeBlockedScript(root);
            return;
        }

        if (root.querySelectorAll) {
            root.querySelectorAll('script').forEach((scriptElement) => {
                if (isBlockedScript(scriptElement)) {
                    removeBlockedScript(scriptElement);
                }
            });
        }
    };

    const wrapCustomModule = (customModuleWrapper) => {
        const customModuleWrapperParent = customModuleWrapper ? customModuleWrapper.parentElement : null;

        if (!customModuleWrapper || !customModuleWrapperParent) {
            return false;
        }

        if (customModuleWrapperParent.matches('ccbm.ldsbm')) {
            return true;
        }

        const customModule = document.createElement('ccbm');
        customModule.className = 'bmext-ldsbm';

        customModuleWrapperParent.insertBefore(customModule, customModuleWrapper);
        customModule.appendChild(customModuleWrapper);
        return true;
    };

    const wrapCustomModuleIn = (root) => {
        if (customModuleWrapped || !root) {
            return;
        }

        if (isElement(root) && root.matches(customModuleWrapperSelector)) {
            customModuleWrapped = wrapCustomModule(root);
            return;
        }

        if (root.querySelector) {
            const customModuleWrapper = root.querySelector(customModuleWrapperSelector);
            if (customModuleWrapper) {
                customModuleWrapped = wrapCustomModule(customModuleWrapper);
            }
        }
    };

    const addClasses = (element) => {
        nonHeaderClasses.forEach((className) => {
            if (!element.classList.contains(className)) {
                element.classList.add(className);
            }
        });
    };

    const addNonHeaderClassesIn = (root) => {
        if (!root) {
            return;
        }

        if (isElement(root) && root.matches(nonHeaderSelector)) {
            addClasses(root);
            nonHeaderClassesAdded = true;
        }

        if (root.querySelectorAll) {
            root.querySelectorAll(nonHeaderSelector).forEach((nonHeaderElement) => {
                addClasses(nonHeaderElement);
                nonHeaderClassesAdded = true;
            });
        }
    };

    const isComplete = () => customModuleWrapped && nonHeaderClassesAdded && removedScriptCount >= 2;

    const targetNode = document.documentElement;
    const observerConfig = { childList: true, subtree: true };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'SCRIPT' && (node.src.includes('/prototype.js') || node.src.includes('/prototype_window/window.js'))) {
                    node.parentNode.removeChild(node);
                    changeCount++;
                }

                if (changeCount === 2) {
                    scriptObserver.disconnect();
                }
            });
        });
    });

    const targetNode = document.documentElement;
    const config = { childList: true, subtree: true };

    scriptObserver.observe(targetNode, config);
})();
