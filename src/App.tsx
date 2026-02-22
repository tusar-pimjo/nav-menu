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
        <section className='bg-slate-950 text-white min-h-screen flex items-center justify-center font-sans'>
            <NavigationMenu>
                <NavigationMenuList>
                    {tabList.map((tab) => (
                        <NavigationMenuItem key={tab.id} value={String(tab.id)}>
                            <NavigationMenuTrigger>
                                {tab.label}
                            </NavigationMenuTrigger>
                            {tab.children && (
                                <NavigationMenuContent>
                                    <TabContent tabId={tab.id} />
                                </NavigationMenuContent>
                            )}
                        </NavigationMenuItem>
                    ))}
                </NavigationMenuList>
                <NavigationMenuViewport />
            </NavigationMenu>
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
            className={`p-3 grid gap-2 ${
                tab.cols === 2 ? 'grid-cols-2' : 'grid-cols-1'
            }`}
            style={{ width: tab.cols === 2 ? 600 : 300 }}
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
    { id: 3, label: 'Docs' },
];

export default App;
