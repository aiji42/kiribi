import {
	CheckCircledIcon,
	CircleIcon,
	CrossCircledIcon,
	ReloadIcon,
	MinusCircledIcon,
	CounterClockwiseClockIcon,
} from '@radix-ui/react-icons';

export const statuses = [
	{
		value: 'PENDING',
		label: 'Pending',
		icon: CircleIcon,
		pulse: false,
		color: 'text-yellow-500',
	},
	{
		value: 'PROCESSING',
		label: 'Processing',
		icon: CounterClockwiseClockIcon,
		pulse: true,
		color: 'text-blue-500',
	},
	{
		value: 'RETRY_PENDING',
		label: 'Retry Pending',
		icon: ReloadIcon,
		pulse: false,
		color: 'text-yellow-500',
	},
	{
		value: 'COMPLETED',
		label: 'Completed',
		icon: CheckCircledIcon,
		pulse: false,
		color: 'text-green-500',
	},
	{
		value: 'FAILED',
		label: 'Failed',
		icon: CrossCircledIcon,
		pulse: false,
		color: 'text-red-500',
	},
	{
		value: 'CANCELLED',
		label: 'Cancelled',
		icon: MinusCircledIcon,
		pulse: false,
		color: 'text-gray-500',
	},
];
