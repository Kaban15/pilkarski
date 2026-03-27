-- Add INVITED to MembershipStatus enum
ALTER TYPE "MembershipStatus" ADD VALUE 'INVITED' BEFORE 'ACCEPTED';
