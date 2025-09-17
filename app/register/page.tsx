"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FirebaseError } from "firebase/app"
import { Eye, EyeOff } from "lucide-react"
import { query, collection, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Terms and Conditions content
const TERMS_AND_CONDITIONS = `
# Terms and Conditions

Last updated: May 24, 2021

Please read these terms and conditions carefully before using Our Service.

## Interpretation and Definitions

### Interpretation
The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.

### Definitions
For the purposes of these Terms and Conditions:

- **Application** means the software program provided by the Company downloaded by You on any electronic device, named OH!Plus
- **Application Store** means the digital distribution service operated and developed by Apple Inc. (Apple App Store) or Google Inc. (Google Play Store) in which the Application has been downloaded.
- **Affiliate** means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.
- **Company** (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to AI Xyndicate, 727 Gawad Tulay Holdings Inc., Gen. Solano St., San Miguel, Manila.
- **Country** refers to: Philippines
- **Device** means any device that can access the Service such as a computer, a cellphone or a digital tablet.
- **Service** refers to the Application.
- **Terms and Conditions** (also referred as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.
- **Third-party Social Media Service** means any services or content (including data, information, products or services) provided by a third-party that may be displayed, included or made available by the Service.
- **You** means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.

## Acknowledgment

These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.

Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.

By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.

You represent that you are over the age of 18. The Company does not permit those under 18 to use the Service.

Your access to and use of the Service is also conditioned on Your acceptance of and compliance with the Privacy Policy of the Company. Our Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your personal information when You use the Application or the Website and tells You about Your privacy rights and how the law protects You. Please read Our Privacy Policy carefully before using Our Service.

## User Accounts

When You create an account with Us, You must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.

You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password, whether Your password is with Our Service or a Third-Party Social Media Service.

You agree not to disclose Your password to any third party. You must notify Us immediately upon becoming aware of any breach of security or unauthorized use of Your account.

You may not use as a username the name of another person or entity or that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity other than You without appropriate authorization, or a name that is otherwise offensive, vulgar or obscene.

## Content

### Your Right to Post Content
Our Service allows You to post Content. You are responsible for the Content that You post to the Service, including its legality, reliability, and appropriateness.

By posting Content to the Service, You grant Us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service. You retain any and all of Your rights to any Content You submit, post or display on or through the Service and You are responsible for protecting those rights.

You represent and warrant that: (i) the Content is Yours (You own it) or You have the right to use it and grant Us the rights and license as provided in these Terms, and (ii) the posting of Your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.

### Content Restrictions
The Company is not responsible for the content of the Service's users. You expressly understand and agree that You are solely responsible for the Content and for all activity that occurs under your account, whether done so by You or any third person using Your account.

You may not transmit any Content that is unlawful, offensive, upsetting, intended to disgust, threatening, libelous, defamatory, obscene or otherwise objectionable. Examples of such objectionable Content include, but are not limited to, the following:

- Unlawful or promoting unlawful activity.
- Defamatory, discriminatory, or mean-spirited content, including references or commentary about religion, race, sexual orientation, gender, national/ethnic origin, or other targeted groups.
- Spam, machine – or randomly – generated, constituting unauthorized or unsolicited advertising, chain letters, any other form of unauthorized solicitation, or any form of lottery or gambling.
- Containing or installing any viruses, worms, malware, trojan horses, or other content that is designed or intended to disrupt, damage, or limit the functioning of any software, hardware or telecommunications equipment or to damage or obtain unauthorized access to any data or other information of a third person.
- Infringing on any proprietary rights of any party, including patent, trademark, trade secret, copyright, right of publicity or other rights.

The Company reserves the right, but not the obligation, to, in its sole discretion, determine whether or not any Content is appropriate and complies with this Terms, refuse or remove this Content. The Company further reserves the right to make formatting and edits and change the manner any Content. The Company can also limit or revoke the use of the Service if You post such objectionable Content.

## Termination

We may terminate or suspend Your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.

Upon termination, Your right to use the Service will cease immediately. If You wish to terminate Your account, You may simply discontinue using the Service.

## Limitation of Liability

Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of this Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.

To the maximum extent permitted by applicable law, in no event shall the Company or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data or other information, for business interruption, for personal injury, loss of privacy arising out of or in any way related to the use of or inability to use the Service, third-party software and/or third-party hardware used with the Service, or otherwise in connection with any provision of this Terms), even if the Company or any supplier has been advised of the possibility of such damages and even if the remedy fails of its essential purpose.

Some states do not allow the exclusion of implied warranties or limitation of liability for incidental or consequential damages, which means that some of the above limitations may not apply. In these states, each party's liability will be limited to the greatest extent permitted by law.

## "AS IS" and "AS AVAILABLE" Disclaimer

The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, the Company, on its own behalf and on behalf of its Affiliates and its and their respective licensors and service providers, expressly disclaims all warranties, whether express, implied, statutory or otherwise, with respect to the Service, including all implied warranties of merchantability, fitness for a particular purpose, title and non-infringement, and warranties that may arise out of course of dealing, course of performance, usage or trade practice. Without limitation to the foregoing, the Company provides no warranty or undertaking, and makes no representation of any kind that the Service will meet Your requirements, achieve any intended results, be compatible or work with any other software, applications, systems or services, operate without interruption, meet any performance or reliability standards or be error free or that any errors or defects can or will be corrected.

Without limiting the foregoing, neither the Company nor any of the company's provider makes any representation or warranty of any kind, express or implied: (i) as to the operation or availability of the Service, or the information, content, and materials or products included thereon; (ii) that the Service will be uninterrupted or error-free; (iii) as to the accuracy, reliability, or currency of any information or content provided through the Service; or (iv) that the Service, its servers, the content, or e-mails sent from or on behalf of the Company are free of viruses, scripts, trojan horses, worms, malware, timebombs or other harmful components.

Some jurisdictions do not allow the exclusion of certain types of warranties or limitations on applicable statutory rights of a consumer, so some or all of the above exclusions and limitations may not apply to You. But in such a case the exclusions and limitations set forth in this section shall be applied to the greatest extent enforceable under applicable law.

## Governing Law

The laws of the Country, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.

## Disputes Resolution

If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Company.

## Changes to These Terms and Conditions

We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.

By continuing to access or use Our Service after those revisions become effective, You agree to be bound by the revised terms. If You do not agree to the new terms, in whole or in part, please stop using the website and the Service.

## Contact Us

If you have any questions about these Terms and Conditions, You can contact us:

By email: support@ohplus.com
`

// Rules and Regulations content
const RULES_AND_REGULATIONS = `
# Rules and Regulations

Last updated: May 24, 2021

These Rules and Regulations ("Rules") govern your use of the OH!Plus platform. By accessing or using our Service, you agree to comply with these Rules.

## General Conduct

### Acceptable Use
You agree to use the OH!Plus platform only for lawful purposes and in accordance with these Rules. You are prohibited from using the platform:

- In any way that violates any applicable federal, state, local, or international law or regulation
- To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation
- To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity
- To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm the Company or users of the Service or expose them to liability

### User Responsibilities
As a user of OH!Plus, you are responsible for:

- Maintaining the confidentiality of your account and password
- All activities that occur under your account
- Ensuring that all information you provide is accurate and up-to-date
- Complying with all applicable laws and regulations
- Respecting the rights of other users and third parties

## Content Guidelines

### Prohibited Content
You may not post, upload, or share content that:

- Is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy
- Contains software viruses or any other computer code, files, or programs designed to interrupt, destroy, or limit the functionality of any computer software or hardware
- Constitutes unauthorized or unsolicited advertising
- Contains false or misleading information

### Content Ownership
You retain ownership of content you submit to OH!Plus, but you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such content in connection with the Service.

## Business Operations

### Service Availability
While we strive to provide continuous service, OH!Plus may be temporarily unavailable due to maintenance, updates, or other reasons. We are not liable for any damages resulting from service interruptions.

### Data Security
We implement reasonable security measures to protect your data, but we cannot guarantee absolute security. You are responsible for maintaining the security of your account credentials.

### Billing and Payments
If you use paid features:

- All fees are non-refundable unless otherwise specified
- You agree to pay all charges associated with your account
- We may change pricing with 30 days' notice
- Failed payments may result in service suspension

## User Interactions

### Communication Standards
When communicating with other users or our team:

- Be respectful and professional
- Do not share personal information without consent
- Report any suspicious or inappropriate behavior
- Use appropriate language and tone

### Dispute Resolution
In case of disputes with other users:

- Attempt to resolve issues directly first
- Contact our support team if direct resolution fails
- We may mediate disputes at our discretion
- We reserve the right to suspend accounts involved in disputes

## Platform Integrity

### System Integrity
You agree not to:

- Attempt to gain unauthorized access to our systems
- Interfere with or disrupt the Service
- Use automated tools to access the Service without permission
- Circumvent any security measures

### Reporting Violations
If you encounter violations of these Rules:

- Report the issue to our support team immediately
- Provide as much detail as possible
- Cooperate with any investigations
- Do not take matters into your own hands

## Account Management

### Account Creation
To create an account:

- You must be at least 18 years old
- Provide accurate and complete information
- Choose a strong, unique password
- Verify your email address

### Account Termination
We may terminate or suspend your account if you:

- Violate these Rules
- Provide false information
- Engage in fraudulent activity
- Fail to pay for services
- Remain inactive for an extended period

## Intellectual Property

### OH!Plus IP
All OH!Plus trademarks, service marks, logos, and content are owned by us and may not be used without permission.

### User-Generated Content
By posting content on OH!Plus:

- You confirm you have the right to share it
- You grant us license to use it as described above
- You agree not to post copyrighted material without permission
- You are responsible for any IP infringement claims

## Legal Compliance

### Applicable Laws
Your use of OH!Plus must comply with:

- All applicable local, state, and federal laws
- International laws if accessing from outside the Philippines
- Industry-specific regulations relevant to your business

### Export Controls
You agree not to use OH!Plus in violation of export control laws or regulations.

## Amendments

We reserve the right to modify these Rules at any time. Changes will be effective immediately upon posting. Your continued use of the Service constitutes acceptance of the modified Rules.

## Contact Information

For questions about these Rules and Regulations, contact us at:
- Email: support@ohplus.com
- Phone: +63 (2) 123-4567
`

// Privacy Policy content (provided by user)
const PRIVACY_POLICY = `Privacy Policy
Last updated: May 24, 2021

This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.

We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy. This Privacy Policy has been created with the help of the Privacy Policy Generator.

Interpretation and Definitions
Interpretation
The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.

Definitions
For the purposes of this Privacy Policy:

Account means a unique account created for You to access our Service or parts of our Service.

Affiliate means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.

Application means the software program provided by the Company downloaded by You on any electronic device, named Wabler

Company (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to AI Xyndicate, 727 Gawad Tulay Holdings Inc., Gen. Solano St., San Miguel, Manila.

Country refers to: Philippines

Device means any device that can access the Service such as a computer, a cellphone or a digital tablet.

Personal Data is any information that relates to an identified or identifiable individual.

Service refers to the Application.

Service Provider means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.

Usage Data refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).

You means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.

Collecting and Using Your Personal Data
Types of Data Collected
Personal Data
While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:

Email address

First name and last name

Phone number

Address, State, Province, ZIP/Postal code, City

Usage Data

Usage Data
Usage Data is collected automatically when using the Service.

Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.

When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers and other diagnostic data.

We may also collect information that Your browser sends whenever You visit our Service or when You access the Service by or through a mobile device.

Information Collected while Using the Application
While using Our Application, in order to provide features of Our Application, We may collect, with Your prior permission:

Information regarding your location
We use this information to provide features of Our Service, to improve and customize Our Service. The information may be uploaded to the Company's servers and/or a Service Provider's server or it may be simply stored on Your device.

You can enable or disable access to this information at any time, through Your Device settings.

Use of Your Personal Data
The Company may use Personal Data for the following purposes:

To provide and maintain our Service, including to monitor the usage of our Service.

To manage Your Account: to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.

For the performance of a contract: the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.

To contact You: To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation.

To provide You with news, special offers and general information about other goods, services and events which we offer that are similar to those that you have already purchased or enquired about unless You have opted not to receive such information.

To manage Your requests: To attend and manage Your requests to Us.

For business transfers: We may use Your information to evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or similar proceeding, in which Personal Data held by Us about our Service users is among the assets transferred.

For other purposes: We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and your experience.

We may share Your personal information in the following situations:

With Service Providers: We may share Your personal information with Service Providers to monitor and analyze the use of our Service, to contact You.
For business transfers: We may share or transfer Your personal information in connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition of all or a portion of Our business to another company.
With Affiliates: We may share Your information with Our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include Our parent company and any other subsidiaries, joint venture partners or other companies that We control or that are under common control with Us.
With business partners: We may share Your information with Our business partners to offer You certain products, services or promotions.
With other users: when You share personal information or otherwise interact in the public areas with other users, such information may be viewed by all users and may be publicly distributed outside.
With Your consent: We may disclose Your personal information for any other purpose with Your consent.
Retention of Your Personal Data
The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.

The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of Our Service, or We are legally obligated to retain this data for longer time periods.

Transfer of Your Personal Data
Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from Your jurisdiction.

Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer.

The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of Your data and other personal information.

Disclosure of Your Personal Data
Business Transactions
If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.

Law enforcement
Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).

Other legal requirements
The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:

Comply with a legal obligation
Protect and defend the rights or property of the Company
Prevent or investigate possible wrongdoing in connection with the Service
Protect the personal safety of Users of the Service or the public
Protect against legal liability
Security of Your Personal Data
The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.

Children's Privacy
Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us. If We become aware that We have collected Personal Data from anyone under the age of 13 without verification of parental consent, We take steps to remove that information from Our servers.

If We need to rely on consent as a legal basis for processing Your information and Your country requires consent from a parent, We may require Your parent's consent before We collect and use that information.

Links to Other Websites
Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit.

We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.

Changes to this Privacy Policy
We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.

We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.

You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.

Contact Us
If you have any questions about this Privacy Policy, You can contact us:


I only have a content of the privacy policy while you generate the terms & condition and the rules and regulations`

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("+63 ")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [invitationRole, setInvitationRole] = useState<string | null>(null)
  const [loadingInvitation, setLoadingInvitation] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0: Terms, 1: Privacy, 2: Rules, 3: Registration
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    rules: false,
  })
  const [scrollAreaRefs, setScrollAreaRefs] = useState<{
    terms: HTMLDivElement | null
    privacy: HTMLDivElement | null
    rules: HTMLDivElement | null
  }>({
    terms: null,
    privacy: null,
    rules: null,
  })

  const { register, user, userData, getRoleDashboardPath } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get organization code from URL parameters
  const orgCode = searchParams.get("orgCode")

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push("/admin/dashboard")
    }
  }, [user, router])

  // Fetch invitation details when code is present
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!orgCode) return

      setLoadingInvitation(true)
      try {
        const invitationQuery = query(collection(db, "invitation_codes"), where("code", "==", orgCode))
        const invitationSnapshot = await getDocs(invitationQuery)

        if (!invitationSnapshot.empty) {
          const invitationDoc = invitationSnapshot.docs[0]
          const invitationData = invitationDoc.data()

          if (invitationData.role) {
            setInvitationRole(invitationData.role)
          }
        } else {
          setErrorMessage("Invalid invitation code.")
        }
      } catch (error) {
        console.error("Error fetching invitation details:", error)
        setErrorMessage("Error loading invitation details.")
      } finally {
        setLoadingInvitation(false)
      }
    }

    fetchInvitationDetails()
  }, [orgCode])

  // Scroll detection for policy agreements
  useEffect(() => {
    const handleScroll = (policyType: keyof typeof agreements) => {
      return () => {
        const scrollArea = scrollAreaRefs[policyType]
        if (scrollArea) {
          const { scrollTop, scrollHeight, clientHeight } = scrollArea
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10 // 10px tolerance
          if (isAtBottom && !agreements[policyType]) {
            setAgreements(prev => ({ ...prev, [policyType]: true }))
          }
        }
      }
    }

    const cleanup: (() => void)[] = []

    Object.keys(scrollAreaRefs).forEach((key) => {
      const policyType = key as keyof typeof agreements
      const scrollArea = scrollAreaRefs[policyType]
      if (scrollArea) {
        const scrollHandler = handleScroll(policyType)
        scrollArea.addEventListener('scroll', scrollHandler)
        cleanup.push(() => scrollArea.removeEventListener('scroll', scrollHandler))
      }
    })

    return () => cleanup.forEach(cleanupFn => cleanupFn())
  }, [scrollAreaRefs, agreements])

  const getFriendlyErrorMessage = (error: unknown): string => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case "auth/email-already-in-use":
          return "This email address is already in use. Please use a different email or log in."
        case "auth/invalid-email":
          return "The email address is not valid. Please check the format."
        case "auth/weak-password":
          return "The password is too weak. Please choose a stronger password (at least 6 characters)."
        case "auth/operation-not-allowed":
          return "Email/password accounts are not enabled. Please contact support."
        case "auth/network-request-failed":
          return "Network error. Please check your internet connection and try again."
        default:
          return "An unexpected error occurred during registration. Please try again."
      }
    }
    return "An unknown error occurred. Please try again."
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (!value.startsWith("+63 ")) {
      setPhoneNumber("+63 ")
      return
    }

    const numbersOnly = value.slice(4).replace(/\D/g, "")
    if (numbersOnly.length <= 10) {
      setPhoneNumber("+63 " + numbersOnly)
    }
  }

  const isPhoneNumberValid = () => {
    const numbersOnly = phoneNumber.slice(4).replace(/\D/g, "")
    return numbersOnly.length === 10
  }

  const passwordCriteria = {
    minLength: password.length >= 8,
    hasLowerCase: /[a-z]/.test(password),
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^a-zA-Z0-9]/.test(password),
  }

  const passwordStrengthScore = Object.values(passwordCriteria).filter(Boolean).length

  const getBarColorClass = (score: number) => {
    if (score === 0) return "bg-gray-300"
    if (score <= 2) return "bg-red-500"
    if (score <= 4) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password"
    if (score <= 2) return "Weak"
    if (score <= 4) return "Moderate"
    return "Strong"
  }

  const handleRegister = async () => {
    setErrorMessage(null)

    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      setErrorMessage("Please fill in all required fields.")
      return
    }

    if (!agreements.terms || !agreements.privacy || !agreements.rules) {
      setErrorMessage("Please read and agree to all Terms and Conditions, Privacy Policy, and Rules and Regulations.")
      return
    }

    if (!isPhoneNumberValid()) {
      setErrorMessage("Phone number must be exactly 10 digits after +63.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      await register(
        {
          email,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          phone_number: phoneNumber,
          gender: "",
        },
        {
          company_name: "",
          company_location: "",
        },
        password,
        orgCode || undefined,
      )

      // Registration successful - redirect will be handled by useEffect
      // The redirect logic will be handled after userData is loaded
    } catch (error: unknown) {
      console.error("Registration failed:", error)
      setErrorMessage(getFriendlyErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  // Role-based navigation after registration
  useEffect(() => {
    console.log("Register navigation useEffect triggered")
    console.log("user:", !!user)
    console.log("userData:", userData)
    console.log("loading:", loading)

    if (user && userData && !loading) {
      console.log("userData.roles:", userData.roles)

      // Check if user is in onboarding
      if (userData.onboarding) {
        console.log("User is in onboarding, redirecting to onboarding flow")
        return
      }

      // Only use the roles array from user_roles collection
      if (userData.roles && userData.roles.length > 0) {
        console.log("Using roles from user_roles collection:", userData.roles)
        const dashboardPath = getRoleDashboardPath(userData.roles)

        if (dashboardPath) {
          console.log("Navigating to:", dashboardPath)
          router.push(dashboardPath)
        } else {
          console.log("No dashboard path found for roles, redirecting to unauthorized")
          router.push("/unauthorized")
        }
      } else {
        console.log("No roles found in user_roles collection, redirecting to unauthorized")
        router.push("/unauthorized")
      }
    }
  }, [user, userData, loading, router, getRoleDashboardPath])

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left Panel - Image */}
      <div className="relative hidden w-full items-center justify-center bg-gray-900 sm:flex lg:w-[40%]">
        <Image
          src="/registration-background.png"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-50"
        />
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-white p-4 dark:bg-gray-950 sm:p-6 lg:w-[60%] lg:p-8">
        <Card className="w-full max-w-md border-none shadow-none sm:max-w-lg">
          <CardHeader className="space-y-1 text-left">
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold">
                {orgCode ? "Join Organization" : "Create an Account"}
              </CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {orgCode ? "Complete your registration to join the organization!" : "It's free to create one!"}
            </CardDescription>
            {orgCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                <p className="text-sm text-blue-800">
                  <strong>Organization Code:</strong> {orgCode}
                </p>
                {loadingInvitation && <p className="text-sm text-blue-600 mt-1">Loading invitation details...</p>}
                {invitationRole && (
                  <p className="text-sm text-green-800 mt-1">
                    <strong>Assigned Role:</strong> {invitationRole}
                  </p>
                )}
                {!loadingInvitation && !invitationRole && orgCode && (
                  <p className="text-sm text-gray-600 mt-1">No specific role assigned</p>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Step Indicator */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center space-x-4">
                {[0, 1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep
                          ? "bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {step + 1}
                    </div>
                    {step < 3 && (
                      <div
                        className={`w-12 h-0.5 mx-2 ${
                          step < currentStep ? "bg-blue-600" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Terms and Conditions</h2>
                  <p className="text-gray-600 dark:text-gray-400">Please read the terms and conditions carefully</p>
                </div>
                <div className="border rounded-md p-4 max-h-96 overflow-hidden">
                  <ScrollArea
                    className="h-80 w-full"
                    ref={(el) => {
                      if (el && !scrollAreaRefs.terms) {
                        setScrollAreaRefs(prev => ({
                          ...prev,
                          terms: el.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
                        }))
                      }
                    }}
                  >
                    <div className="pr-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {TERMS_AND_CONDITIONS}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms-agreement"
                    checked={agreements.terms}
                    onCheckedChange={() => {}} // Read-only, auto-checked by scroll
                    disabled={!agreements.terms}
                  />
                  <Label htmlFor="terms-agreement" className="text-sm">
                    I have read and agree to the Terms and Conditions
                  </Label>
                </div>
                <Button
                  className={`w-full text-white ${
                    agreements.terms
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={() => setCurrentStep(1)}
                  disabled={!agreements.terms}
                >
                  Next: Privacy Policy
                </Button>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Privacy Policy</h2>
                  <p className="text-gray-600 dark:text-gray-400">Please read the privacy policy carefully</p>
                </div>
                <div className="border rounded-md p-4 max-h-96 overflow-hidden">
                  <ScrollArea
                    className="h-80 w-full"
                    ref={(el) => {
                      if (el && !scrollAreaRefs.privacy) {
                        setScrollAreaRefs(prev => ({
                          ...prev,
                          privacy: el.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
                        }))
                      }
                    }}
                  >
                    <div className="pr-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {PRIVACY_POLICY}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privacy-agreement"
                    checked={agreements.privacy}
                    onCheckedChange={() => {}} // Read-only, auto-checked by scroll
                    disabled={!agreements.privacy}
                  />
                  <Label htmlFor="privacy-agreement" className="text-sm">
                    I have read and agree to the Privacy Policy
                  </Label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCurrentStep(0)}
                  >
                    Back
                  </Button>
                  <Button
                    className={`flex-1 text-white ${
                      agreements.privacy
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => setCurrentStep(2)}
                    disabled={!agreements.privacy}
                  >
                    Next: Rules & Regulations
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Rules and Regulations</h2>
                  <p className="text-gray-600 dark:text-gray-400">Please read the rules and regulations carefully</p>
                </div>
                <div className="border rounded-md p-4 max-h-96 overflow-hidden">
                  <ScrollArea
                    className="h-80 w-full"
                    ref={(el) => {
                      if (el && !scrollAreaRefs.rules) {
                        setScrollAreaRefs(prev => ({
                          ...prev,
                          rules: el.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement
                        }))
                      }
                    }}
                  >
                    <div className="pr-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {RULES_AND_REGULATIONS}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rules-agreement"
                    checked={agreements.rules}
                    onCheckedChange={() => {}} // Read-only, auto-checked by scroll
                    disabled={!agreements.rules}
                  />
                  <Label htmlFor="rules-agreement" className="text-sm">
                    I have read and agree to the Rules and Regulations
                  </Label>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    className={`flex-1 text-white ${
                      agreements.rules
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => setCurrentStep(3)}
                    disabled={!agreements.rules}
                  >
                    Next: Registration
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold mb-2">Complete Registration</h2>
                  <p className="text-gray-600 dark:text-gray-400">Fill in your details to create your account</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name (Optional)</Label>
                  <Input
                    id="middleName"
                    placeholder=""
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Cellphone number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+63 9XXXXXXXXX"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    className={!isPhoneNumberValid() && phoneNumber.length > 4 ? "border-red-500" : ""}
                    required
                  />
                  {!isPhoneNumberValid() && phoneNumber.length > 4 && (
                    <p className="text-xs text-red-500">Phone number must be exactly 10 digits after +63</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="flex gap-1 h-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 ${
                            i < passwordStrengthScore ? getBarColorClass(passwordStrengthScore) : "bg-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getStrengthText(passwordStrengthScore)}
                    </p>
                    {passwordStrengthScore < 5 && password.length > 0 && (
                      <ul className="list-inside text-sm mt-1">
                        {!passwordCriteria.minLength && (
                          <li className="text-red-500">Password should be at least 8 characters long</li>
                        )}
                        {!passwordCriteria.hasLowerCase && (
                          <li className="text-red-500">Password should contain at least one lowercase letter</li>
                        )}
                        {!passwordCriteria.hasUpperCase && (
                          <li className="text-red-500">Password should contain at least one uppercase letter</li>
                        )}
                        {!passwordCriteria.hasNumber && (
                          <li className="text-red-500">Password should contain at least one number</li>
                        )}
                        {!passwordCriteria.hasSpecialChar && (
                          <li className="text-red-500">Password should contain at least one special character</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    type="submit"
                    onClick={handleRegister}
                    disabled={loading || loadingInvitation}
                  >
                    {loading ? (orgCode ? "Joining..." : "Signing Up...") : orgCode ? "Join Organization" : "Sign Up"}
                  </Button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="text-red-500 text-sm mt-4 text-center" role="alert">
                {errorMessage}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
