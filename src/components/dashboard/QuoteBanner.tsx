import Image from 'next/image'

export default function QuoteBanner() {
    return (
        <div className="rounded-2xl overflow-hidden relative"
             style={{ aspectRatio: 'auto', minHeight: '80px' }}>
            <Image
                src="/coolthings.jpg"
                alt="Quote banner"
                width={800}
                height={200}
                className="w-full h-full object-cover rounded-2xl"
                style={{ display: 'block' }}
                priority
            />
        </div>
    )
}