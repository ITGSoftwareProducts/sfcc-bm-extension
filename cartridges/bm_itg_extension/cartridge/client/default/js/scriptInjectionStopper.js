(() => {
    let changeCount = 0;

    const scriptObserver = new MutationObserver((mutations) => {
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
