// Transactions page client script
(function(){
  function ready(fn){ if(document.readyState!=='loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); } }

  ready(function(){
    if (!window.jQuery) return; // safety
    const $ = window.jQuery;

    // Initialize DataTables (if plugin is loaded)
    if ($.fn && typeof $.fn.DataTable === 'function') {
      ['#pendingTable', '#approvedTable', '#rejectedTable'].forEach(sel => {
        if ($(sel).length) { $(sel).DataTable(); }
      });
    }

    // Open status change popup
    $(document).on('click', '.btn-change-state', function(e){
      e.preventDefault();
      $('#statusPopup').removeClass('hidden');
    });

    // Close/cancel popup
    $(document).on('click', '#cancelPopup', function(e){
      e.preventDefault();
      $('#statusPopup').addClass('hidden');
    });

    // Dynamic key/value pairs
    const makeRow = (k = '', v = '') => (
      `<div class="flex gap-2 items-center">
         <input type="text" class="key-input border p-2 rounded w-1/2" placeholder="Key" value="${k}">
         <input type="text" class="value-input border p-2 rounded w-1/2" placeholder="Value" value="${v}">
         <button type="button" class="removeKV text-red-600">Remove</button>
       </div>`
    );

    $(document).on('click', '#addInput', function(e){
      e.preventDefault();
      $('#keyValueInputs').append(makeRow());
    });

    $(document).on('click', '.removeKV', function(){
      $(this).closest('div').remove();
    });

    // Submit popup - collect values (no backend call wired yet)
    $(document).on('click', '#submitPopup', function(e){
      e.preventDefault();
      const status = $('#statusSelect').val();
      const kv = {};
      $('#keyValueInputs .key-input').each(function(i, el){
        const key = $(el).val();
        const val = $(el).siblings('.value-input').val();
        if (key) kv[key] = val;
      });
      // TODO: integrate with backend endpoint when available
      // For now just close and optionally inform user
      $('#statusPopup').addClass('hidden');
      if (window.Swal) {
        Swal.fire({title: 'Status prepared', text: `Status: ${status}\nExtras: ${JSON.stringify(kv)}`, icon: 'success'});
      }
    });
  });
})();
