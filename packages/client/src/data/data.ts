import { CheckCircledIcon, CircleIcon, CrossCircledIcon, Half2Icon, ReloadIcon } from '@radix-ui/react-icons';

export const statuses = [
	{
		value: 'PENDING',
		label: 'Pending',
		icon: CircleIcon,
		rotate: false,
		color: 'text-yellow-500',
	},
	{
		value: 'PROCESSING',
		label: 'Processing',
		icon: Half2Icon,
		rotate: true,
		color: 'text-blue-500',
	},
	{
		value: 'RETRY_PENDING',
		label: 'Retry Pending',
		icon: ReloadIcon,
		rotate: false,
		color: 'text-yellow-500',
	},
	{
		value: 'COMPLETED',
		label: 'Completed',
		icon: CheckCircledIcon,
		rotate: false,
		color: 'text-green-500',
	},
	{
		value: 'FAILED',
		label: 'Failed',
		icon: CrossCircledIcon,
		rotate: false,
		color: 'text-red-500',
	},
];
