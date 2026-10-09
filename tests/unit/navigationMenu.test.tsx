import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { AnimatedNavFramer } from '../../src/components/ui/navigation-menu';
import { Button } from '../../src/components/ui/button';
import { Input } from '../../src/components/ui/input';
import { Label } from '../../src/components/ui/label';
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
