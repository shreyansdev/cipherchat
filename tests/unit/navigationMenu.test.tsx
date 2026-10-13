import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { AnimatedNavFramer } from '../../src/components/ui/navigation-menu';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Label } from '../../src/components/ui/Label';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '../../src/components/ui/sheet';

// Mock framer-motion useScroll and useMotionValueEvent
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useScroll: () => ({ scrollY: { get: () => 0 } }),
    useMotionValueEvent: vi.fn(),
  };
});

describe('AnimatedNavFramer Component', () => {
  it('renders default navigation items', () => {
    render(<AnimatedNavFramer />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders custom navigation items and handles click', () => {
    const handleClick = vi.fn();
    const customItems = [
      { name: 'Protocol', href: '#protocol' },
      { name: 'Security', href: '#security' },
    ];

    render(
      <AnimatedNavFramer 
        items={customItems} 
        onItemClick={handleClick}
      />
    );

    const protocolLink = screen.getByText('Protocol');
    expect(protocolLink).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();

    fireEvent.click(protocolLink);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(customItems[0], expect.anything());
  });

  it('renders custom logo if provided', () => {
    render(
      <AnimatedNavFramer 
        logo={<span data-testid="custom-logo">MyLogo</span>} 
      />
    );
    expect(screen.getByTestId('custom-logo')).toBeInTheDocument();
  });

  it('renders mobile menu trigger button', () => {
    render(<AnimatedNavFramer />);
    const mobileTrigger = screen.getByLabelText('Open navigation menu');
    expect(mobileTrigger).toBeInTheDocument();
  });

  it('opens mobile navigation drawer on trigger click and handles item click', () => {
    const handleClick = vi.fn();
    const customItems = [
      { name: 'Protocol', href: '#protocol' },
      { name: 'Security', href: '#security' },
    ];

    render(
      <AnimatedNavFramer 
        items={customItems} 
        onItemClick={handleClick}
      />
    );

    const mobileTrigger = screen.getByLabelText('Open navigation menu');
    fireEvent.click(mobileTrigger);

    // Mobile drawer should now be open with title and items
    expect(screen.getByText('Navigation Protocol')).toBeInTheDocument();
    
    // In mobile drawer, items are clickable
    const mobileLinks = screen.getAllByText('Protocol');
    // One link in desktop nav, one link in mobile drawer
    expect(mobileLinks.length).toBe(2);
    
    // Click the mobile drawer link
    fireEvent.click(mobileLinks[1]);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(customItems[0], expect.anything());
  });

  it('closes mobile drawer when viewport is resized to desktop width', () => {
    render(<AnimatedNavFramer />);
    const mobileTrigger = screen.getByLabelText('Open navigation menu');
    fireEvent.click(mobileTrigger);

    expect(screen.getByText('Navigation Protocol')).toBeInTheDocument();

    // Trigger window resize to desktop
    window.innerWidth = 1024;
    fireEvent(window, new Event('resize'));

    // Drawer closes so title is removed
    expect(screen.queryByText('Navigation Protocol')).not.toBeInTheDocument();
  });
});

describe('shadcn UI Components', () => {
  it('renders Button component with variant and size', () => {
    render(<Button variant="destructive" size="sm">Delete</Button>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain('bg-destructive');
  });

  it('renders Input component', () => {
    render(<Input placeholder="Enter username" />);
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  it('renders Label component', () => {
    render(<Label htmlFor="test">Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders Sheet component and opens on trigger click', () => {
    render(
      <Sheet>
        <SheetTrigger asChild>
          <button>Open Drawer</button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Drawer Title</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );

    const trigger = screen.getByRole('button', { name: 'Open Drawer' });
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByText('Drawer Title')).toBeInTheDocument();
  });
});
