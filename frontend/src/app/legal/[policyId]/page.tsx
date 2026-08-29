import React from 'react';
import { Metadata } from 'next';
import { PolicyView } from '@/components/legal/PolicyView';
import { getPolicyById, POLICY_SLUGS } from '@/data/legalContent';

interface PageProps {
  params: Promise<{ policyId: string }>;
}

export async function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({
    policyId: slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { policyId } = await params;
  const policy = getPolicyById(policyId.toLowerCase());

  if (!policy) {
    return {
      title: 'Legal Policies & Compliance | JanSetu',
      description: 'Official legal policies, compliance statements, and terms of service for JanSetu.'
    };
  }

  return {
    title: `${policy.title} | JanSetu Legal Repository`,
    description: policy.metaDescription,
    openGraph: {
      title: `${policy.title} - JanSetu National Civic Portal`,
      description: policy.metaDescription,
      type: 'article',
    }
  };
}

export default async function LegalPolicyDynamicPage({ params }: PageProps) {
  const { policyId } = await params;
  return <PolicyView policyId={policyId} />;
}
