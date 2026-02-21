import { ChevronDown } from '@tailgrids/icons';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-aria-components';

const contentVariants = {
    initial: (direction: number) => ({
        x: `${direction * 50}%`,
        opacity: 0,
    }),
    animate: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: `${direction * -50}%`,
        opacity: 0,
    }),
};

const CLOSE_DELAY = 150;

function App() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTabId, setActiveTabId] = useState<number | null>(null);
    const [prevTabId, setPrevTabId] = useState<number | null>(null);

    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverContentRef = useRef<HTMLDivElement>(null);
    const closeTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [containerSize, setContainerSize] = useState<{
        width: number;
        height: number;
    } | null>(null);

    const closeImmediately = useCallback(() => {
        clearTimeout(closeTimeout.current);
        setIsOpen(false);
        setActiveTabId(null);
        setContainerSize(null);
    }, []);

    const closeNav = useCallback(() => {
        closeTimeout.current = setTimeout(() => {
            setIsOpen(false);
            setActiveTabId(null);
            setContainerSize(null);
        }, CLOSE_DELAY);
    }, []);

    const cancelClose = useCallback(() => {
        clearTimeout(closeTimeout.current);
    }, []);

    const openNav = useCallback(
        (tabId: number) => {
            clearTimeout(closeTimeout.current);

            const tab = tabList.find((t) => t.id === tabId);
            if (!tab?.children) {
                closeNav();
                return;
            }

            setActiveTabId((prev) => {
                if (prev !== tabId) {
                    setPrevTabId(prev);
                }
                return tabId;
            });
            setIsOpen(true);
        },
        [closeNav],
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => clearTimeout(closeTimeout.current);
    }, []);

    // Measure new content via callback ref.
    // Fires each time a new TabContent mounts (keyed by activeTabId),
    // so measurement timing is consistent for both hover and keyboard.
    const measureCallback = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            requestAnimationFrame(() => {
                setContainerSize({
                    width: node.offsetWidth,
                    height: node.offsetHeight,
                });
            });
        }
    }, []);

    // Close on outside pointer interaction or Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (e: PointerEvent) => {
            const target = e.target as Node;
            const isInsideTrigger = triggerRef.current?.contains(target);
            const isInsidePopover = popoverContentRef.current?.contains(target);

            if (!isInsideTrigger && !isInsidePopover) {
                closeImmediately();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeImmediately();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, closeImmediately]);

    // Close when focus leaves both trigger bar and popover
    const handleFocusLeave = useCallback(
        (e: React.FocusEvent) => {
            const relatedTarget = e.relatedTarget as Node | null;

            if (!relatedTarget) {
                closeNav();
                return;
            }

            const isInsideTrigger = triggerRef.current?.contains(relatedTarget);
            const isInsidePopover =
                popoverContentRef.current?.contains(relatedTarget);

            if (!isInsideTrigger && !isInsidePopover) {
                closeNav();
            }
        },
        [closeNav],
    );

    const activeTabIndex = tabList.findIndex((t) => t.id === activeTabId);
    const prevTabIndex = tabList.findIndex((t) => t.id === prevTabId);
    const direction = activeTabIndex > prevTabIndex ? 1 : -1;

    return (
        <section className='bg-slate-950 text-white min-h-screen flex items-center justify-center font-sans'>
            <nav aria-label='Main' className='relative'>
                <div
                    ref={triggerRef}
                    className='flex items-center p-2 bg-slate-900/40 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md relative z-10'
                    onBlur={handleFocusLeave}
                >
                    {tabList.map((tab) => (
                        <Button
                            key={tab.id}
                            aria-haspopup={tab.children ? 'true' : undefined}
                            aria-expanded={
                                tab.children
                                    ? isOpen && activeTabId === tab.id
                                    : undefined
                            }
                            onMouseEnter={() => openNav(tab.id)}
                            onMouseLeave={closeNav}
                            onFocus={() => {
                                // Don't open the popover on focus alone.
                                // Only switch content when popover is already open
                                // (e.g. user Tabs between triggers while popover is visible).
                                if (isOpen && tab.children) {
                                    openNav(tab.id);
                                }
                            }}
                            onPress={() => {
                                // Enter / Space / Click opens the popover
                                if (tab.children) {
                                    if (isOpen && activeTabId === tab.id) {
                                        closeImmediately();
                                    } else {
                                        openNav(tab.id);
                                    }
                                }
                            }}
                            className={`px-5 py-2.5 rounded-xl flex items-center gap-2 outline-none transition-all duration-300 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:text-white ${
                                activeTabId === tab.id && isOpen
                                    ? 'bg-white/10 text-white shadow-sm'
                                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <span className='font-medium text-sm'>
                                {tab.label}
                            </span>
                            {tab.children && (
                                <ChevronDown
                                    className={`w-3.5 h-3.5 opacity-70 transition-transform duration-300 ${
                                        isOpen && activeTabId === tab.id
                                            ? 'rotate-180'
                                            : ''
                                    }`}
                                />
                            )}
                        </Button>
                    ))}
                </div>

                {isOpen && activeTabId !== null && (
                    <div
                        ref={popoverContentRef}
                        className='absolute top-full left-0 pt-3 z-50 overflow-hidden'
                        onMouseEnter={cancelClose}
                        onMouseLeave={closeNav}
                        onFocus={cancelClose}
                        onBlur={handleFocusLeave}
                    >
                        <motion.div
                            animate={
                                containerSize
                                    ? {
                                          width: containerSize.width,
                                          height: containerSize.height,
                                      }
                                    : undefined
                            }
                            initial={false}
                            className='overflow-hidden bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-black/5 dark:border-white/10'
                            style={{ borderRadius: 12 }}
                            transition={{
                                width: {
                                    duration: 0.35,
                                    ease: [0.22, 1, 0.36, 1],
                                },
                                height: {
                                    duration: 0.35,
                                    ease: [0.22, 1, 0.36, 1],
                                },
                            }}
                        >
                            <AnimatePresence
                                mode='popLayout'
                                initial={false}
                                custom={direction}
                            >
                                {activeTabId !== null && (
                                    <motion.div
                                        key={activeTabId}
                                        custom={direction}
                                        variants={contentVariants}
                                        initial='initial'
                                        animate='animate'
                                        exit='exit'
                                        transition={{
                                            x: {
                                                duration: 0.35,
                                                ease: [0.22, 1, 0.36, 1],
                                            },
                                            opacity: {
                                                duration: 0.175,
                                                ease: [0.25, 0.1, 0.25, 1],
                                            },
                                        }}
                                    >
                                        <div
                                            ref={measureCallback}
                                            className='w-max'
                                        >
                                            <TabContent tabId={activeTabId} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}
            </nav>
        </section>
    );
}

function TabContent({ tabId }: { tabId: number }) {
    const tab = tabList.find((t) => t.id === tabId);
    if (!tab || !tab.children) return null;

    return (
        <div
            role='menu'
            aria-label={tab.label}
            className={`p-3 grid gap-2 ${tab.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}
            style={{ width: tab.cols === 2 ? 600 : 300 }}
        >
            {tab.children.map((child) => (
                <a
                    key={child.id}
                    role='menuitem'
                    tabIndex={-1}
                    href='#'
                    onClick={(e) => e.preventDefault()}
                    className='group flex flex-col justify-center hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 p-4 rounded-xl transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
                >
                    <div className='title text-sm font-semibold text-slate-900 dark:text-zinc-100'>
                        {child.label}
                    </div>
                    <div className='text-sm text-slate-500 dark:text-zinc-400 mt-1 leading-snug'>
                        {child.description}
                    </div>
                </a>
            ))}
        </div>
    );
}

const tabList = [
    {
        id: 1,
        label: 'Getting Started',
        cols: 1,
        children: [
            {
                id: 1,
                label: 'Installation',
                description: 'How to install Tailwind CSS',
            },
            {
                id: 2,
                label: 'Configuration',
                description: 'How to configure Tailwind CSS',
            },
            {
                id: 3,
                label: 'Customization',
                description: 'How to customize Tailwind CSS',
            },
        ],
    },
    {
        id: 2,
        label: 'Components',
        cols: 2,
        children: [
            {
                id: 1,
                label: 'Button',
                description: 'How to use Button component',
            },
            {
                id: 2,
                label: 'Input',
                description: 'How to use Input component',
            },
            {
                id: 3,
                label: 'Select',
                description: 'How to use Select component',
            },
            {
                id: 4,
                label: 'Modal',
                description: 'How to use Modal component',
            },
            {
                id: 5,
                label: 'Popover',
                description: 'How to use Popover component',
            },
            {
                id: 6,
                label: 'Dialog',
                description: 'How to use Dialog component',
            },
        ],
    },
    { id: 3, label: 'Docs' },
];

export default App;
