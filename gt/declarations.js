    // user custom variables that you need to modify
	const glb_location='/gt/templates/';
	const config_file_name='/gt/building_v2.json';
	const materials_folder='/gt/materials';
	const hallspics_prefix= '/gt'; //empty string if pics at the root folder
	const icons_folder='/gt/icons';
	
	//program constants
	const regul_exp_door=/^d_/;
	const regul_exp_tail= /_[0-9]*$/;
	//const regul_exp_artworks=/^(?!d_).*_\d{1,3}$/;
	const regul_exp_artworks=/_\d{1,3}$/;
	const frame_material="BJS_white"