import { gsap } from 'gsap'

export const initTransitions = () => {
    const overlay = document.querySelector('.page-transition')
    const logo = document.querySelector('.transition-logo')

    // Entrance Animation
    window.addEventListener('load', () => {
        const tl = gsap.timeline({
            defaults: { ease: 'power3.inOut' }
        })

        tl.to(logo, { opacity: 1, y: 0, duration: 0.4 })
            .to(overlay, {
                opacity: 0,
                duration: 0.6,
                onComplete: () => {
                    overlay.classList.remove('active')
                    gsap.set(overlay, { clearProps: 'all' })
                }
            }, "+=0.2")
    })

    // Exit Animation using Event Delegation
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a')
        if (!link) return

        const href = link.getAttribute('href')

        // Only for internal links that aren't anchors/special
        const isInternal = href &&
            !href.startsWith('#') &&
            !href.startsWith('mailto:') &&
            !href.startsWith('tel:') &&
            !link.hasAttribute('target') &&
            !href.startsWith('http')

        if (isInternal) {
            e.preventDefault()

            const tl = gsap.timeline({
                onComplete: () => {
                    window.location.href = href
                }
            })

            overlay.classList.add('active')
            gsap.set(overlay, { opacity: 0 })

            tl.to(overlay, {
                opacity: 1,
                duration: 0.5,
                ease: 'power3.inOut'
            })
                .to(logo, {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    ease: 'power3.out'
                }, "-=0.3")
        }
    })
}
