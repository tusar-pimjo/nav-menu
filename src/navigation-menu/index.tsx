import type { Placement } from '@react-types/overlays';
import { ChevronDown } from '@tailgrids/icons';
import type { HTMLMotionProps } from 'motion/react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(inputs.filter(Boolean).join(' '));
}

class ContentStore {
    contents = new Map<string, React.ReactNode>();
    listeners = new Set<() => void>();
    add(value: string, content: React.ReactNode) {
        this.contents.set(value, content);
        this.emit();
    }
    remove(value: string) {
        this.contents.delete(value);
        this.emit();
    }
    emit() {
        this.listeners.forEach((l) => l());
    }
    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };
}

type NavigationMenuContextValue = {
    isOpen: boolean;
    activeValue: string | null;
    prevValue: string | null;
    openNav: (value: string) => void;
    closeNav: () => void;
    closeImmediately: () => void;
    cancelClose: () => void;
    triggerRef: React.RefObject<HTMLUListElement | null>;
    triggersRef: React.MutableRefObject<Map<string, HTMLElement | null>>;
    popoverContentRef: React.RefObject<HTMLDivElement | null>;
    containerSize: { width: number; height: number } | null;
    measureCallback: (node: HTMLDivElement | null) => void;
    contentStore: ContentStore;
    itemsRef: React.MutableRefObject<string[]>;
    direction: number;
};

const NavigationMenuContext =
    React.createContext<NavigationMenuContextValue | null>(null);

function useNavigationMenu() {
    const context = React.useContext(NavigationMenuContext);
    if (!context) {
        throw new Error(
            'useNavigationMenu must be used within a NavigationMenu',
        );
    }
    return context;
}

type NavigationMenuItemContextValue = {
    value: string;
};

const NavigationMenuItemContext =
    React.createContext<NavigationMenuItemContextValue | null>(null);

function useNavigationMenuItem() {
    const context = React.useContext(NavigationMenuItemContext);
    if (!context) {
        throw new Error(
            'useNavigationMenuItem must be used within a NavigationMenuItem',
        );
    }
    return context;
}

const CLOSE_DELAY = 150;

export const NavigationMenu = React.forwardRef<
    HTMLElement,
    React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [activeValue, setActiveValue] = React.useState<string | null>(null);
    const [prevValue, setPrevValue] = React.useState<string | null>(null);

    const triggerRef = React.useRef<HTMLUListElement>(null);
    const triggersRef = React.useRef<Map<string, HTMLElement | null>>(
        new Map(),
    );
    const popoverContentRef = React.useRef<HTMLDivElement>(null);
    const closeTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined);
    const [containerSize, setContainerSize] = React.useState<{
        width: number;
        height: number;
    } | null>(null);

    const [contentStore] = React.useState(() => new ContentStore());
    const itemsRef = React.useRef<string[]>([]);
    const [direction, setDirection] = React.useState(1);

    const closeImmediately = React.useCallback(() => {
        clearTimeout(closeTimeout.current);
        setIsOpen(false);
        setActiveValue(null);
        setContainerSize(null);
    }, []);

    const closeNav = React.useCallback(() => {
        closeTimeout.current = setTimeout(() => {
            setIsOpen(false);
            setActiveValue(null);
            setContainerSize(null);
        }, CLOSE_DELAY);
    }, []);

    const cancelClose = React.useCallback(() => {
        clearTimeout(closeTimeout.current);
    }, []);

    const openNav = React.useCallback(
        (value: string) => {
            clearTimeout(closeTimeout.current);

            // If the triggered item doesn't have content registered, don't open the menu
            if (!contentStore.contents.has(value)) {
                closeNav();
                return;
            }

            setActiveValue((prev) => {
                if (prev !== value) {
                    setPrevValue(prev);
                    const activeTabIndex = itemsRef.current.findIndex(
                        (v) => v === value,
                    );
                    const prevTabIndex = itemsRef.current.findIndex(
                        (v) => v === prev,
                    );
                    setDirection(activeTabIndex > prevTabIndex ? 1 : -1);
                }
                return value;
            });
            setIsOpen(true);
        },
        [closeNav, contentStore],
    );

    React.useEffect(() => {
        return () => clearTimeout(closeTimeout.current);
    }, []);

    const observerRef = React.useRef<ResizeObserver | null>(null);

    const measureCallback = React.useCallback((node: HTMLDivElement | null) => {
        if (!node) return;

        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        observerRef.current = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setContainerSize({
                    width: (entry.target as HTMLElement).offsetWidth,
                    height: (entry.target as HTMLElement).offsetHeight,
                });
            }
        });
        observerRef.current.observe(node);
    }, []);

    React.useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    React.useEffect(() => {
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

    return (
        <NavigationMenuContext.Provider
            value={{
                isOpen,
                activeValue,
                prevValue,
                openNav,
                closeNav,
                closeImmediately,
                cancelClose,
                triggerRef,
                triggersRef,
                popoverContentRef,
                containerSize,
                measureCallback,
                contentStore,
                itemsRef,
                direction,
            }}
        >
            <nav
                ref={ref}
                aria-label='Main'
                className={cn(
                    'relative z-10 flex max-w-max flex-1 items-center justify-center',
                    className,
                )}
                {...props}
            >
                {children}
            </nav>
        </NavigationMenuContext.Provider>
    );
});
NavigationMenu.displayName = 'NavigationMenu';

export const NavigationMenuList = React.forwardRef<
    HTMLUListElement,
    React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
    const { triggerRef, popoverContentRef, closeNav } = useNavigationMenu();

    const mergedRef = React.useCallback(
        (node: HTMLUListElement) => {
            triggerRef.current = node;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        },
        [triggerRef, ref],
    );

    const handleFocusLeave = React.useCallback(
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
        [closeNav, triggerRef, popoverContentRef],
    );

    return (
        <ul
            ref={mergedRef}
            onBlur={handleFocusLeave}
            className={cn(
                'group flex flex-1 list-none items-center justify-center p-2 bg-slate-900/40 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md relative z-10',
                className,
            )}
            {...props}
        />
    );
});
NavigationMenuList.displayName = 'NavigationMenuList';

export const NavigationMenuItem = React.forwardRef<
    HTMLLIElement,
    React.LiHTMLAttributes<HTMLLIElement> & { value: string }
>(({ className, value, ...props }, ref) => {
    const { itemsRef } = useNavigationMenu();

    React.useEffect(() => {
        if (!itemsRef.current.includes(value)) {
            itemsRef.current.push(value);
        }
    }, [value, itemsRef]);

    return (
        <NavigationMenuItemContext.Provider value={{ value }}>
            <li ref={ref} className={cn('relative', className)} {...props} />
        </NavigationMenuItemContext.Provider>
    );
});
NavigationMenuItem.displayName = 'NavigationMenuItem';

export const NavigationMenuTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onKeyDown, ...props }, ref) => {
    const { value } = useNavigationMenuItem();
    const {
        isOpen,
        activeValue,
        openNav,
        closeNav,
        closeImmediately,
        contentStore,
        popoverContentRef,
        triggersRef,
    } = useNavigationMenu();

    const mergedRef = React.useCallback(
        (node: HTMLButtonElement | null) => {
            triggersRef.current.set(value, node);
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        },
        [triggersRef, value, ref],
    );

    React.useEffect(() => {
        const triggersMap = triggersRef.current;
        return () => {
            triggersMap.delete(value);
        };
    }, [value, triggersRef]);

    const getHasContent = React.useCallback(
        () => contentStore.contents.has(value),
        [contentStore, value],
    );
    const hasContent = React.useSyncExternalStore(
        contentStore.subscribe,
        getHasContent,
    );

    const isActive = isOpen && activeValue === value;

    return (
        <button
            ref={mergedRef}
            aria-haspopup={hasContent ? 'true' : undefined}
            aria-expanded={hasContent ? isActive : undefined}
            onMouseEnter={() => {
                if (hasContent) openNav(value);
            }}
            onMouseLeave={closeNav}
            onFocus={() => {
                if (isOpen && activeValue !== value) {
                    closeImmediately();
                }
            }}
            onClick={() => {
                if (hasContent) {
                    if (isActive) {
                        closeImmediately();
                    } else {
                        openNav(value);
                    }
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey && isOpen && isActive) {
                    const popover = popoverContentRef.current;
                    if (popover) {
                        const focusableElements = Array.from(
                            popover.querySelectorAll<HTMLElement>(
                                'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
                            ),
                        ).filter(
                            (el) =>
                                !el.hasAttribute('disabled') &&
                                el.getAttribute('aria-hidden') !== 'true',
                        );
                        if (focusableElements.length > 0) {
                            e.preventDefault();
                            focusableElements[0].focus();
                        }
                    }
                }
                onKeyDown?.(e);
            }}
            className={cn(
                'group inline-flex w-max items-center justify-center outline-none transition-all duration-300 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:text-white px-5 py-2.5 rounded-xl',
                isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'bg-transparent text-slate-300 hover:text-white hover:bg-white/5',
                className,
            )}
            {...props}
        >
            <span className='font-medium text-sm'>{children}</span>
            {hasContent && (
                <ChevronDown
                    className={cn(
                        'ml-2 h-3.5 w-3.5 opacity-70 transition-transform duration-300',
                        isActive ? 'rotate-180' : '',
                    )}
                    aria-hidden='true'
                />
            )}
        </button>
    );
});
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

export const NavigationMenuContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const { value } = useNavigationMenuItem();
    const { contentStore } = useNavigationMenu();

    React.useEffect(() => {
        contentStore.add(
            value,
            <div ref={ref} className={cn('w-full', className)} {...props}>
                {children}
            </div>,
        );
        return () => {
            contentStore.remove(value);
        };
    }, [value, contentStore, children, className, ref, props]);

    return null;
});
NavigationMenuContent.displayName = 'NavigationMenuContent';

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

export interface NavigationMenuViewportProps extends Omit<
    HTMLMotionProps<'div'>,
    'ref'
> {
    anchor?: 'container' | 'trigger';
    placement?: Placement;
}

export const NavigationMenuViewport = React.forwardRef<
    HTMLDivElement,
    NavigationMenuViewportProps
>(
    (
        {
            className,
            onKeyDown,
            anchor = 'container',
            placement = 'bottom',
            ...props
        },
        ref,
    ) => {
        const {
            isOpen,
            activeValue,
            popoverContentRef,
            containerSize,
            measureCallback,
            cancelClose,
            closeNav,
            closeImmediately,
            triggerRef,
            triggersRef,
            contentStore,
            direction,
        } = useNavigationMenu();

        const activeContent = React.useSyncExternalStore(
            contentStore.subscribe,
            () => (activeValue ? contentStore.contents.get(activeValue) : null),
        );

        const mergedRef = React.useCallback(
            (node: HTMLDivElement | null) => {
                popoverContentRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            },
            [popoverContentRef, ref],
        );

        const [position, setPosition] = React.useState<{
            top: number;
            left: number;
        } | null>(null);

        const [isInitialPlacement, setIsInitialPlacement] =
            React.useState(true);

        React.useLayoutEffect(() => {
            if (!isOpen) {
                setIsInitialPlacement(true);
            } else if (position) {
                requestAnimationFrame(() => {
                    setIsInitialPlacement(false);
                });
            }
        }, [isOpen, position]);

        React.useLayoutEffect(() => {
            if (!isOpen || !activeValue || !containerSize) {
                if (!isOpen) setPosition(null);
                return;
            }

            const targetNode =
                anchor === 'trigger' && activeValue
                    ? triggersRef.current.get(activeValue) || triggerRef.current
                    : triggerRef.current;

            if (!targetNode) return;

            const targetRect = targetNode.getBoundingClientRect();
            const offset = 12;
            const padding = 12;

            let left = 0;
            const top = targetRect.bottom + offset;

            if (placement === 'bottom left' || placement.includes('start')) {
                left = targetRect.left;
            } else if (
                placement === 'bottom right' ||
                placement.includes('end')
            ) {
                left = targetRect.right - containerSize.width;
            } else {
                left =
                    targetRect.left +
                    targetRect.width / 2 -
                    containerSize.width / 2;
            }

            left = Math.max(
                padding,
                Math.min(
                    left,
                    window.innerWidth - containerSize.width - padding,
                ),
            );

            setPosition({ top, left });
        }, [
            activeValue,
            isOpen,
            anchor,
            triggersRef,
            triggerRef,
            containerSize,
            placement,
        ]);

        const handleFocusLeave = React.useCallback(
            (e: React.FocusEvent) => {
                const relatedTarget = e.relatedTarget as Node | null;

                if (!relatedTarget) {
                    closeNav();
                    return;
                }

                const isInsideTrigger =
                    triggerRef.current?.contains(relatedTarget);
                const isInsidePopover =
                    popoverContentRef.current?.contains(relatedTarget);

                if (!isInsideTrigger && !isInsidePopover) {
                    closeNav();
                }
            },
            [closeNav, triggerRef, popoverContentRef],
        );

        if (!isOpen || !activeValue) return null;

        return (
            <motion.div
                ref={mergedRef as React.Ref<HTMLDivElement>}
                className={cn('fixed z-50', className)}
                style={{
                    ...props.style,
                    visibility:
                        position && containerSize ? 'visible' : 'hidden',
                    pointerEvents: position && containerSize ? 'auto' : 'none',
                }}
                animate={{
                    top: position?.top,
                    left: position?.left,
                    width: containerSize?.width,
                    height: containerSize?.height,
                }}
                transition={{
                    duration: isInitialPlacement ? 0 : 0.35,
                    ease: [0.22, 1, 0.36, 1],
                }}
                onMouseEnter={cancelClose}
                onMouseLeave={closeNav}
                onFocus={cancelClose}
                onBlur={handleFocusLeave}
                onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                        const popover = popoverContentRef.current;
                        if (!popover) return;

                        const focusableElements = Array.from(
                            popover.querySelectorAll<HTMLElement>(
                                'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])',
                            ),
                        ).filter(
                            (el) =>
                                !el.hasAttribute('disabled') &&
                                el.getAttribute('aria-hidden') !== 'true',
                        );

                        if (focusableElements.length > 0) {
                            const firstElement = focusableElements[0];
                            const lastElement =
                                focusableElements[focusableElements.length - 1];

                            if (e.shiftKey && e.target === firstElement) {
                                e.preventDefault();
                                const activeTrigger =
                                    triggerRef.current?.querySelector<HTMLElement>(
                                        `button[aria-expanded="true"]`,
                                    );
                                if (activeTrigger) {
                                    activeTrigger.focus();
                                    closeImmediately();
                                }
                            } else if (
                                !e.shiftKey &&
                                e.target === lastElement
                            ) {
                                const activeTrigger =
                                    triggerRef.current?.querySelector<HTMLElement>(
                                        `button[aria-expanded="true"]`,
                                    );
                                if (activeTrigger) {
                                    const allFocusableItems = Array.from(
                                        triggerRef.current?.querySelectorAll<HTMLElement>(
                                            'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                                        ) || [],
                                    );
                                    const currentIndex =
                                        allFocusableItems.indexOf(
                                            activeTrigger,
                                        );
                                    const nextItem =
                                        allFocusableItems[currentIndex + 1];
                                    if (nextItem) {
                                        e.preventDefault();
                                        nextItem.focus();
                                        closeImmediately();
                                    }
                                }
                            }
                        }
                    }
                    onKeyDown?.(e);
                }}
                {...props}
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
                    className='overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-black/5 dark:border-white/10 relative'
                    style={{ borderRadius: 12 }}
                    transition={{
                        width: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                        height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                    }}
                >
                    <AnimatePresence
                        mode='popLayout'
                        initial={false}
                        custom={direction}
                    >
                        <motion.div
                            key={activeValue}
                            custom={direction}
                            variants={contentVariants}
                            initial='initial'
                            animate='animate'
                            exit='exit'
                            transition={{
                                x: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                                opacity: {
                                    duration: 0.175,
                                    ease: [0.25, 0.1, 0.25, 1],
                                },
                            }}
                        >
                            <div ref={measureCallback} className='w-max'>
                                {activeContent}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        );
    },
);
NavigationMenuViewport.displayName = 'NavigationMenuViewport';
