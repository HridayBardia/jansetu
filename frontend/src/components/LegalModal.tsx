'use client';

import React from 'react';
import { LegalConsentModal, LegalConsentModalProps } from './LegalConsentModal';

export interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'terms' | 'privacy';
  role?: 'citizen' | 'admin';
  onAccept?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  type = 'terms',
  role = 'citizen',
  onAccept
}) => {
  return (
    <LegalConsentModal
      isOpen={isOpen}
      onClose={onClose}
      initialTab={type}
      role={role}
      onAccept={onAccept}
    />
  );
};

export default LegalModal;
