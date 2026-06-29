'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function MobileNav({
    isSignedIn = false,
    userAvatar = ""
}: {
    isSignedIn?: boolean,
    userAvatar?: string
}) {
    const pathname = usePathname();
    const navItems = [
        { icon: 'home', label: 'Home', path: '/' },
        { icon: 'styles', label: 'Styles', path: '/styles' },
        { icon: 'you', label: 'You', path: '/channel' },
    ];

    const getIcon = (item: any) => {
        const isActive = pathname === item.path;
        const icons: { [key: string]: JSX.Element } = {
            home: isActive ? (
                <svg className="w-6 h-6 text-zinc-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z"/></svg>
            ) : (
                <svg className="w-6 h-6 text-zinc-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M304 70.1C313.1 61.9 326.9 61.9 336 70.1L568 278.1C577.9 286.9 578.7 302.1 569.8 312C560.9 321.9 545.8 322.7 535.9 313.8L527.9 306.6L527.9 511.9C527.9 547.2 499.2 575.9 463.9 575.9L175.9 575.9C140.6 575.9 111.9 547.2 111.9 511.9L111.9 306.6L103.9 313.8C94 322.6 78.9 321.8 70 312C61.1 302.2 62 287 71.8 278.1L304 70.1zM320 120.2L160 263.7L160 512C160 520.8 167.2 528 176 528L224 528L224 424C224 384.2 256.2 352 296 352L344 352C383.8 352 416 384.2 416 424L416 528L464 528C472.8 528 480 520.8 480 512L480 263.7L320 120.3zM272 528L368 528L368 424C368 410.7 357.3 400 344 400L296 400C282.7 400 272 410.7 272 424L272 528z"/></svg>
            ),
            styles: (
                <Image
                    src={isActive ? '/styles-icon-blue.svg' : '/styles-icon.svg'}
                    alt="Styles"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                    style={isActive ? undefined : { filter: 'brightness(0) saturate(100%)' }}
                />
            ),
            you: isActive ? (
                <svg className="w-6 h-6 text-zinc-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M240 192C240 147.8 275.8 112 320 112C364.2 112 400 147.8 400 192C400 236.2 364.2 272 320 272C275.8 272 240 236.2 240 192zM448 192C448 121.3 390.7 64 320 64C249.3 64 192 121.3 192 192C192 262.7 249.3 320 320 320C390.7 320 448 262.7 448 192zM144 544C144 473.3 201.3 416 272 416L368 416C438.7 416 496 473.3 496 544L496 552C496 565.3 506.7 576 520 576C533.3 576 544 565.3 544 552L544 544C544 446.8 465.2 368 368 368L272 368C174.8 368 96 446.8 96 544L96 552C96 565.3 106.7 576 120 576C133.3 576 144 565.3 144 552L144 544z"/></svg>
            ) : (
                <svg className="w-6 h-6 text-zinc-900" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M240 192C240 147.8 275.8 112 320 112C364.2 112 400 147.8 400 192C400 236.2 364.2 272 320 272C275.8 272 240 236.2 240 192zM448 192C448 121.3 390.7 64 320 64C249.3 64 192 121.3 192 192C192 262.7 249.3 320 320 320C390.7 320 448 262.7 448 192zM144 544C144 473.3 201.3 416 272 416L368 416C438.7 416 496 473.3 496 544L496 552C496 565.3 506.7 576 520 576C533.3 576 544 565.3 544 552L544 544C544 446.8 465.2 368 368 368L272 368C174.8 368 96 446.8 96 544L96 552C96 565.3 106.7 576 120 576C133.3 576 144 565.3 144 552L144 544z"/></svg>
            ),
        };
        return icons[item.icon];
    };

    return (
        <nav suppressHydrationWarning className="mobile-nav-fixed lg:hidden bg-white border-t border-zinc-200 pb-safe">
            <div suppressHydrationWarning className="flex items-center justify-around h-[50px] w-full">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] active:scale-95 transition-transform"
                        >
                            <span className={`${isActive ? 'text-zinc-900' : 'text-zinc-500'} transition-colors`}>
                                {getIcon(item)}
                            </span>
                            {item.label && (
                                <span className={`text-[10px] ${isActive ? 'font-bold text-zinc-900' : 'font-medium text-zinc-500'} transition-colors`}>
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

// Add CSS for slide-in animation if not already present

