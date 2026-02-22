import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
} from './navigation-menu';

function App() {
    return (
        <section className='bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center font-sans gap-20 p-10'>
            <div className='flex flex-col items-center gap-4'>
                <h2 className='text-xl font-bold text-slate-400'>
                    1. Anchored to Container (Bottom Left)
                </h2>
                <NavigationMenu>
                    <NavigationMenuStructure />
                    <NavigationMenuViewport
                        anchor='container'
                        placement='bottom left'
                    />
                </NavigationMenu>
            </div>

            <div className='flex flex-col items-center gap-4'>
                <h2 className='text-xl font-bold text-slate-400'>
                    2. Anchored to Trigger (Bottom Center)
                </h2>
                <NavigationMenu>
                    <NavigationMenuStructure />
                    <NavigationMenuViewport
                        anchor='trigger'
                        placement='bottom'
                    />
                </NavigationMenu>
            </div>
        </section>
    );
}

function NavigationMenuStructure() {
    return (
        <NavigationMenuList>
            {tabList.map((tab) => (
                <NavigationMenuItem key={tab.id} value={String(tab.id)}>
                    {tab.children ? (
                        <>
                            <NavigationMenuTrigger>
                                {tab.label}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <TabContent tabId={tab.id} />
                            </NavigationMenuContent>
                        </>
                    ) : (
                        <a
                            href='#'
                            className='group inline-flex w-max items-center justify-center outline-none transition-all duration-300 ease-out cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:text-white px-5 py-2.5 rounded-xl bg-transparent text-slate-300 hover:text-white hover:bg-white/5'
                        >
                            {tab.label}
                        </a>
                    )}
                </NavigationMenuItem>
            ))}
        </NavigationMenuList>
    );
}

function TabContent({ tabId }: { tabId: number }) {
    const tab = tabList.find((t) => t.id === tabId);
    if (!tab || !tab.children) return null;

    return (
        <div
            role='menu'
            aria-label={tab.label}
            className={`p-3 grid gap-2 w-fit ${
                tab.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'
            } ${tab.id === 3 ? 'min-w-100' : ''} ${tab.id === 1 ? 'min-w-80' : ''}`}
        >
            {tab.children.map((child) => (
                <a
                    key={child.id}
                    role='menuitem'
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
    {
        id: 3,
        label: 'Resources',
        cols: 1,
        children: [
            {
                id: 1,
                label: 'Button',
                description: 'How to use Button component',
            },
        ],
    },
    { id: 4, label: 'Docs' },
];

export default App;
