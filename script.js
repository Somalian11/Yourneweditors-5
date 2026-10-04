(function(){

  /* ---------- clients strip: moves only as the page scrolls ---------- */
  /* No auto-play. How far the strip has travelled through the viewport
     (0 as it enters at the bottom, 1 as it leaves at the top) is mapped
     onto how far the list has slid sideways, so scrolling down walks
     you through every name and scrolling back up walks you back. */
  (function(){
    var box = document.querySelector('.marquee');
    var track = document.getElementById('clientsMarqueeTrack');
    if(!box || !track) return;
    var ticking = false;

    function update(){
      ticking = false;
      var bandEl = document.getElementById('clientsBand');
      if(bandEl && bandEl.classList.contains('is-open')){ track.style.transform = ''; return; }
      var rect = box.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var progress = (vh - rect.top) / (vh + rect.height);
      progress = Math.max(0, Math.min(1, progress));
      var overflow = Math.max(0, track.scrollWidth - box.clientWidth);
      track.style.transform = 'translate3d(' + (-progress * overflow) + 'px,0,0)';
    }
    function onScroll(){
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', update);
    update();
  })();

  /* ---------- "Edited for": the arrow under the bar makes it taller ---------- */
  (function(){
    var band = document.getElementById('clientsBand');
    var btn = document.querySelector('.clients-arrow');
    if(!band || !btn) return;
    btn.addEventListener('click', function(){
      var open = band.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      // let the sideways-scroll code switch itself off/on
      window.dispatchEvent(new Event('scroll'));
    });
  })();

  /* ---------- force page to open at the very top ---------- */
  /* Mobile browsers sometimes restore the last scroll position when a
     link is reopened (especially after backgrounding the tab or coming
     back via history), which makes the page look like it "starts" a bit
     lower than the top. Unless the URL is deliberately pointing at a
     section (a #hash), always land at the top. This only happens once, when
     the page opens. It must never run again later (for example when loading
     finishes), or it would throw someone back to the top after they have
     already started scrolling. */
  if('scrollRestoration' in history){ history.scrollRestoration = 'manual'; }
  if(!window.location.hash){
    window.scrollTo(0, 0);
  }

  /* ---------- pricing tabs / swipeable carousel ---------- */
  var carousel = document.querySelector('.pricing-carousel');
  var tabs = document.querySelectorAll('.pricing-tab');
  if(carousel && tabs.length){
    var cards = carousel.querySelectorAll('.plan');
    tabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        var idx = parseInt(tab.getAttribute('data-target'), 10);
        var card = cards[idx];
        if(card){
          carousel.scrollTo({ left: card.offsetLeft - carousel.offsetLeft, behavior: 'smooth' });
        }
      });
    });
    var syncActiveTab = function(){
      var scrollLeft = carousel.scrollLeft;
      var closest = 0, closestDist = Infinity;
      cards.forEach(function(card, i){
        var dist = Math.abs((card.offsetLeft - carousel.offsetLeft) - scrollLeft);
        if(dist < closestDist){ closestDist = dist; closest = i; }
      });
      tabs.forEach(function(tab, i){
        tab.classList.toggle('active', i === closest);
      });
    };
    var scrollTimer;
    carousel.addEventListener('scroll', function(){
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(syncActiveTab, 80);
    });
  }

  /* ---------- cursor dot ---------- */
  var dot = document.getElementById('cursorDot');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(dot && !reduceMotion){
    window.addEventListener('mousemove', function(e){
      dot.style.transform = 'translate('+e.clientX+'px,'+e.clientY+'px) translate(-50%,-50%)';
    });
    document.querySelectorAll('a, button, .tile').forEach(function(el){
      el.addEventListener('mouseenter', function(){ dot.classList.add('hover'); });
      el.addEventListener('mouseleave', function(){ dot.classList.remove('hover'); });
    });
  }

  /* ---------- nav scroll state ---------- */
  var nav = document.getElementById('siteNav');
  window.addEventListener('scroll', function(){
    if(window.scrollY > 40){ nav.classList.add('scrolled'); }
    else{ nav.classList.remove('scrolled'); }
  });

  /* ---------- mobile nav toggle ---------- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  toggle.addEventListener('click', function(){
    var isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });
  links.querySelectorAll('[data-close]').forEach(function(el){
    el.addEventListener('click', function(){
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.15 });
    /* the video blocks are very tall on a phone, so waiting for 15% of them
       to be on screen left a big blank black area while scrolling toward
       them. They fade in as soon as they are close instead. */
    var ioEarly = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          ioEarly.unobserve(entry.target);
        }
      });
    }, { threshold:0, rootMargin:'0px 0px 40% 0px' });
    revealEls.forEach(function(el){
      if(el.classList.contains('reveal-early')){ ioEarly.observe(el); } else { io.observe(el); }
    });
  } else {
    revealEls.forEach(function(el){ el.classList.add('in-view'); });
  }

  /* ---------- start the other 5 videos without delaying page load ---------- */
  /* The 3 main videos load straight away, declared in the HTML, so they are
     ready as fast as possible. But a browser's own "page is loading"
     indicator waits for every video declared that way, so 7 of them kept it
     spinning far longer than the page actually took to become usable. The
     other 5 (the 4 grid videos and the closing one) start from a script
     instead, right away but not declared in the HTML, so the browser
     considers the page loaded immediately while these still fetch in the
     background exactly as before. */
  function startVideo(video){
    var src = video.getAttribute('data-src');
    if(!src) return;
    var fallback = video.getAttribute('data-fallback');
    if(fallback){
      video.addEventListener('error', function once(){
        video.removeEventListener('error', once);
        if(video.getAttribute('src') === src){ video.src = fallback; }
      });
    }
    video.src = src;
    video.removeAttribute('data-src');
    video.setAttribute('preload', 'auto');
    video.load();   // start the real download now; setting src alone with
                     // preload="none" does not, it waits until this video
                     // happens to scroll into view
  }

  /* the 3 main videos start right away, same as before. The other 5 (the
     4 grid videos and the closing one) wait until the page has actually
     finished loading first. A browser's own "page is loading" indicator
     waits for every video that is genuinely downloading, so having all 8
     start at once kept it spinning for several seconds after the page was
     already fully usable. Waiting for "load" first means visitors see that
     indicator finish quickly, and these 5 then carry on loading in the
     background exactly as before, just a moment later. */
  document.querySelectorAll('.offer-reel video[data-src]').forEach(startVideo);
  var deferredVideos = document.querySelectorAll('.tile-reel video[data-src], .close-video video[data-src]');
  if(document.readyState === 'complete'){
    deferredVideos.forEach(startVideo);
  } else {
    window.addEventListener('load', function(){ deferredVideos.forEach(startVideo); });
  }

  /* ---------- team bio read more/less ---------- */
  document.querySelectorAll('.team-bio-toggle').forEach(function(btn){
    btn.addEventListener('click', function(){
      var wrap = btn.closest('.team-bio-wrap');
      var open = wrap.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- reel video autoplay ---------- */
  /* Autoplay policies differ wildly: sandboxed iframes often block .play()
     until the user has interacted. We try several strategies:
       1) set muted as a JS property (not just attribute)
       2) call play() immediately on load
       3) call play() when the video enters the viewport
       4) kick everything alive on the first user interaction anywhere
       5) tap-to-play fallback on the video itself */
  var reelVideos = document.querySelectorAll('.video-grid video, .offer-video video, .offer-reel video, .close-video video');
  reelVideos.forEach(function(video){
    video.muted = true;
    video.autoplay = video.hasAttribute('autoplay');
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    // Toggle the is-playing class on the parent so the play indicator fades
    var parent = video.closest('.tile') || video.closest('.offer-video') || video.closest('.offer-reel') || video.closest('.close-video');
    if(parent){
      video.addEventListener('playing', function(){ parent.classList.add('is-playing'); });
      video.addEventListener('pause', function(){ parent.classList.remove('is-playing'); });
      video.addEventListener('ended', function(){ parent.classList.remove('is-playing'); });
    }
  });

  /* only play what is actually on screen; the rest starts when you get there */
  function onScreen(video){
    var r = video.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  function tryPlayAll(){
    reelVideos.forEach(function(video){
      if(video.paused && onScreen(video)){
        var p = video.play();
        if(p !== undefined) p.catch(function(){});
      }
    });
  }

  // 1) immediate attempt
  tryPlayAll();

  // 1b) safety-net retry loop. It used to give up after ~4 seconds, which
  //     is not long enough on a slow phone connection (video data can take
  //     longer than that to arrive), so it now keeps trying every half
  //     second for 30 seconds. It only ever calls play() on videos that are
  //     on screen and paused, so it costs nothing once they are running.
  var playRetries = 0;
  var playRetryTimer = setInterval(function(){
    playRetries++;
    tryPlayAll();
    if(playRetries > 60) clearInterval(playRetryTimer);
  }, 500);

  // 2) attempt again at each readiness milestone (some browsers fire one
  //    but not another depending on how the data URI decodes)
  reelVideos.forEach(function(video){
    ['loadedmetadata','loadeddata','canplay','canplaythrough'].forEach(function(ev){
      video.addEventListener(ev, function(){
        if(video.paused && onScreen(video)){ video.play().catch(function(){}); }
      });
    });
  });

  // 3) IntersectionObserver: play when scrolled into view, pause when out
  if('IntersectionObserver' in window){
    var vio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var video = entry.target;
        video._visible = entry.isIntersecting;
        if(entry.isIntersecting){
          if(video.paused){
            var p = video.play();
            if(p !== undefined) p.catch(function(){});
          }
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.15 });
    reelVideos.forEach(function(video){ vio.observe(video); });
  }

  // 4) kick everything alive on user gestures. The old version tried ONCE,
  //    on the first event of any kind (usually the touch that starts a
  //    scroll, which iPhones do not count as a real tap), removed all its
  //    listeners, and never tried again. Now: scroll/touchstart still give
  //    one early attempt, but real taps, clicks and key presses keep
  //    retrying for the life of the page.
  function firstScroll(){
    tryPlayAll();
    ['scroll','touchstart'].forEach(function(ev){
      window.removeEventListener(ev, firstScroll, true);
    });
  }
  ['scroll','touchstart'].forEach(function(ev){
    window.addEventListener(ev, firstScroll, { capture: true, passive: true });
  });
  ['touchend','click','pointerup','keydown'].forEach(function(ev){
    window.addEventListener(ev, tryPlayAll, { capture: true, passive: true });
  });

  // 4b) coming back to the tab / the page being restored from the
  //     back-forward cache: browsers pause videos meanwhile, restart them
  document.addEventListener('visibilitychange', function(){
    if(!document.hidden) tryPlayAll();
  });
  window.addEventListener('pageshow', tryPlayAll);

  // 5) tap the video to play if all else failed
  reelVideos.forEach(function(video){
    video.addEventListener('click', function(){
      if(video.paused){ video.play().catch(function(){}); }
    });
  });

  /* ---------- carousel scroll hint ---------- */
  document.querySelectorAll('.carousel-strip-wrap').forEach(function(wrap){
    var strip = wrap.querySelector('.carousel-strip');
    var hint = wrap.querySelector('.carousel-scroll-hint');
    if(!strip || !hint) return;
    strip.addEventListener('scroll', function(){
      hint.classList.add('is-hidden');
    }, { once:true, passive:true });
    hint.addEventListener('click', function(){
      hint.classList.add('is-hidden');
      strip.scrollTo({ left: strip.scrollWidth - strip.clientWidth, behavior:'smooth' });
    });
  });

  /* ---------- reel mute/unmute toggle ---------- */
  document.querySelectorAll('.reel-mute-btn').forEach(function(btn){
    var video = btn.previousElementSibling;
    if(!video || video.tagName !== 'VIDEO') return;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var nowMuted = !video.muted;
      video.muted = nowMuted;
      if(nowMuted){
        video.setAttribute('muted', '');
      } else {
        // some mobile browsers key their audio policy off the HTML
        // attribute as well as the JS property, and want an explicit
        // play() call inside the same tap to actually start the audio
        video.removeAttribute('muted');
        video.volume = 1;
        var p = video.play();
        if(p !== undefined) p.catch(function(){});
      }
      btn.setAttribute('aria-pressed', nowMuted ? 'false' : 'true');
      btn.setAttribute('aria-label', nowMuted ? 'Unmute video' : 'Mute video');
    });
  });

  /* ---------- count-up stats ---------- */
  var counters = document.querySelectorAll('.count-up');
  function animateCount(el){
    var target = parseInt(el.getAttribute('data-target'), 10);
    if(reduceMotion){ el.textContent = target; return; }
    var start = 0, duration = 1400, startTime = null;
    function step(ts){
      if(!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if(progress < 1){ requestAnimationFrame(step); }
      else { el.textContent = target; }
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold:0.5 });
    counters.forEach(function(el){ cio.observe(el); });
  } else {
    counters.forEach(function(el){ el.textContent = el.getAttribute('data-target'); });
  }

  /* ---------- modal ---------- */
  /* Nothing on the site opens this anymore (every button is a mailto-cta
     now). Guarded so a page without the modal's HTML doesn't throw and
     break everything below. */
  var overlay = document.getElementById('modalOverlay');
  var openBtns = document.querySelectorAll('.open-modal');
  var closeBtn = document.getElementById('modalClose');
  var formBody = document.getElementById('formBody');
  var successState = document.getElementById('successState');
  var leadForm = document.getElementById('leadForm');
  var lastFocused = null;

  function openModal(){
    lastFocused = document.activeElement;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    var firstField = document.getElementById('f-name');
    if(firstField) setTimeout(function(){ firstField.focus(); }, 300);
  }
  function closeModal(){
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if(lastFocused) lastFocused.focus();
  }

  if(overlay && closeBtn && leadForm){
    openBtns.forEach(function(btn){ btn.addEventListener('click', openModal); });
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e){ if(e.target === overlay) closeModal(); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
    });
  }

  /* ---------- "Get your new editors" buttons: skip the modal, just pop
     open the visitor's email app straight to our inbox. Simple and works
     everywhere, like a lot of sites do it. ---------- */
  document.querySelectorAll('.mailto-cta').forEach(function(btn){
    btn.addEventListener('click', function(){
      window.location.href = 'mailto:yourneweditors@gmail.com?subject='
        + encodeURIComponent('Enquiry from your website');
    });
  });

  if(leadForm) leadForm.addEventListener('submit', function(e){
    e.preventDefault();
    var name = leadForm.name.value.trim();
    var venue = leadForm.venue.value.trim();
    var instagram = leadForm.instagram.value.trim();
    var email = leadForm.email.value.trim();
    var message = leadForm.message.value.trim();

    var subject = 'New enquiry from ' + (venue || name || 'website visitor');
    var body = [
      'Name: ' + name,
      'Venue: ' + venue,
      'Instagram: ' + (instagram || '-'),
      'Email: ' + email,
      '',
      'What they\'re looking for:',
      message || '-'
    ].join('\n');

    var mailtoUrl = 'mailto:yourneweditors@gmail.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);

    window.location.href = mailtoUrl;

    formBody.classList.add('hidden');
    successState.classList.add('show');
  });

})();
